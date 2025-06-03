import { Scene, Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { throttle } from "@/game-root/utils/lodash.ts";
import { VoxelEngine } from "@engine/core/VoxelEngine.ts";
import { ChunkData, Coords, Position } from "@engine/types/chunk.type.ts";
import { Chunk } from "@engine/chunk/Chunk.ts";
import { blocks, getBlocksMap } from "@/game-root/block-definitions/blocks.ts";
import Assets from "@/game-root/assets";
import { useBlockStore, usePlayerStore, useWorldStore } from "@/store";
import { Player } from "@/game-root/player/Player.ts";
import { blockApi, worldApi } from "@/api";
import GameWindow from "@/game-root/core/GameWindow.ts";
import { PlayerInputSystem } from "@/game-root/player/PlayerInputSystem.ts";
import GameClient from "@/game-root/client/GameClient.ts";
import { playerEvents } from "@/game-root/core/events.ts";
import { IChunkSetting } from "@/game-root/client/interface.ts";
import { WorldController } from "@engine/core/WorldController.ts";
import { NpcPlayer } from "@/game-root/player/NpcPlayer.ts";
import MathUtils from "@/game-root/utils/MathUtils.ts";

// import { Inspector } from "@babylonjs/inspector";

export class Game {
	public canvas: HTMLCanvasElement;
	private voxelEngine: VoxelEngine;
	private scene!: Scene;
	private player!: Player;
	private gameClient!: GameClient;
	private npcPlayers: Map<number, NpcPlayer> = new Map();

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		GameWindow.create(canvas);
		const voxel = new VoxelEngine(canvas);
		this.gameClient = new GameClient();
		this.voxelEngine = voxel;
		this.registerBlocks();
		voxel.onUpdate(() => {
			PlayerInputSystem.Instance.update();
		}, false);
	}

	private get playerStore() {
		return usePlayerStore.getState();
	}

	private get worldStore() {
		return useWorldStore.getState();
	}

	private get blockStore() {
		return useBlockStore.getState();
	}

	public async start() {
		console.log("Starting Game");
		this.scene = this.voxelEngine.createScene();
		this.voxelEngine.loadTextures(this.scene, [{ key: "blocks", path: Assets.blocks.atlas }]);

		const chunkSetting = await this.gameClient.joinWorld(
			this.worldStore.worldId,
			this.playerStore.playerId
		);

		const worldController = this.registerChunk(chunkSetting);

		this.player = new Player(this.scene, this.canvas);

		await this.bindEvents(worldController);

		this.voxelEngine.start(this.scene);

		await worldController.updateChunk(this.playerStore.origin);

		this.attachFPSDisplay(this.scene);
	}

	public dispose() {
		this.voxelEngine.dispose();
		this.gameClient.disConnectAll();
		this.npcPlayers.clear();
		this.worldStore.reset();
		this.playerStore.reset();
		this.scene.dispose();
		playerEvents.removeAllListeners();
	}

	public destroy() {
		this.dispose();
		GameWindow.Instance.dispose();
	}

	private async bindEvents(worldController: WorldController) {
		const playerClient = this.gameClient.playerClient;

		playerClient.onPlayerJoined(playerId => {
			console.log("playerJoined", playerId);
			const player = new NpcPlayer(this.scene, playerId);
			this.initPlayerPosition(player.setPosition);
			this.npcPlayers.set(playerId, player);
		});

		playerClient.onPlayerMove(moveData => {
			const player = this.npcPlayers.get(moveData.playerId);
			const { x, y, z } = moveData;
			player?.moveTo(new Vector3(x, y, z));
		});

		playerClient.onPlayerLeave(playerId => {
			const player = this.npcPlayers.get(playerId);
			player?.dispose();
		});

		playerClient.onPlaceBlock(blockActionData => {
			worldController.setBlock(blockActionData, blockActionData.blockId);
		});

		this.player.onPlaceBlock(playerClient.sendPlaceBlock.bind(playerClient));

		playerEvents.on("move", (playerPos: Position) => {
			worldController.updateChunk(playerPos);
			const { x, y, z } = playerPos;
			playerClient.sendPlayerMove({ x, y, z, playerId: this.playerStore.playerId });
		});

		worldController.onChunkUpdated(isInit => {
			if (isInit) {
				this.initPlayerPosition(position => this.player.setPosition(position));
			}
		});
	}

	private initPlayerPosition(setPosition: (position: Vector3) => void) {
		const [x, y, z] = this.worldStore.worldController!.getChunkCenterTop(
			this.playerStore.origin.x,
			this.playerStore.origin.z
		);
		setPosition(new Vector3(x, y + 2, z));
	}

	private flatWorldGenerator() {
		const generator = (chunkX: number, chunkZ: number) => {
			const chunkData: ChunkData = {
				blocks: new Uint16Array(65536),
				shafts: new Uint8Array(256),
				position: {
					x: chunkX,
					z: chunkZ,
				},
			};

			// 生成基础地形
			for (let y = 0; y < 256; y++) {
				const id = y == 4 ? 4 : y < 4 ? 3 : 0;
				for (let z = 0; z < 16; z++) {
					for (let x = 0; x < 16; x++) {
						const index = y * 16 * 16 + z * 16 + x;
						chunkData.blocks[index] = id;
					}
				}
			}
			return Chunk.fromJSON(chunkData);
		};
		return async (coords: Coords) => coords.map(coord => generator(coord.x, coord.z));
	}

	private attachFPSDisplay(scene: Scene) {
		const guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("FPS-UI", true, scene);

		const fpsLabel = new TextBlock();
		fpsLabel.color = "white";
		fpsLabel.fontSize = 18;
		fpsLabel.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_RIGHT;
		fpsLabel.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_TOP;
		fpsLabel.paddingRight = 10;
		fpsLabel.paddingTop = 10;

		guiTexture.addControl(fpsLabel);

		const updateFPS = throttle(() => {
			fpsLabel.text = `FPS: ${Math.floor(this.voxelEngine.engine.getFps())}`;
		}, 1000);

		this.scene.onBeforeRenderObservable.add(updateFPS);
	}

	private registerChunk(chunkSetting: IChunkSetting) {
		const worldController = this.voxelEngine.registerChunk(this.worldGenerator(), chunkSetting);
		useWorldStore.setState({ worldController });
		return worldController;
	}

	private worldGenerator() {
		return async (coords: Coords) => {
			const chunksData = await worldApi.generateChunks(this.worldStore.worldId, coords);

			return chunksData.map(
				(chunkData: { cells: number[]; shafts: number[]; x: number; z: number }) =>
					Chunk.fromJSON({
						blocks: <Uint16Array>MathUtils.decompressRLE(chunkData.cells, value => {
							const blockId = this.blockStore.extractBlockId(value);
							return blockId;
						}),
						shafts: <Uint8Array>MathUtils.decompressRLE(chunkData.shafts),
						position: {
							x: chunkData.x,
							z: chunkData.z,
						},
					})
			);
		};
	}

	private async registerBlocks() {
		const blockTypes = await blockApi.getBlockTypes();
		// 验证客户端与服务器之间方块表是否完全匹配
		const blocksMap = getBlocksMap();
		Object.entries(blockTypes.byName).forEach(([blockType, blockId]) => {
			if (blockId === 0) return;
			if (!blocksMap[blockType]) {
				throw new Error(`Block ${blockType} was not defined in website.`);
			}
		});
		const combinBlocks = blocks.map(block => ({
			...block,
			id: blockTypes.byName[block.blockType] ?? block.id,
		}));
		// 合并方块表:服务器 > 客户端
		const blockRegistry = this.voxelEngine.registerBlocks(combinBlocks);
		useBlockStore.setState({ blockRegistry });
	}
}
