import { Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { throttle } from "@/game-root/utils/lodash.ts";
import { VoxelEngine } from "@engine/core/VoxelEngine.ts";
import { ChunkData, Coords } from "@engine/types/chunk.type.ts";
import { Chunk } from "@engine/chunk/Chunk.ts";
import { blocks, getBlocksMap } from "@/game-root/block-definitions/blocks.ts";
import Assets from "@/game-root/assets";
import { useBlockStore, usePlayerStore, useWorldStore } from "@/store";
import { Player } from "@/game-root/player/Player.ts";
import { blockApi, worldApi } from "@/ui-root/api";
import GameWindow from "@/game-root/core/GameWindow.ts";
import { PlayerInputSystem } from "@/game-root/player/PlayerInputSystem.ts";
import GameClient from "@/game-root/client/GameClient.ts";
import { playerEvents } from "@/game-root/core/events.ts";
import { IChunkSetting } from "@/game-root/client/interface.ts";
import { WorldController } from "@engine/core/WorldController.ts";
import { NpcPlayer } from "@/game-root/player/NpcPlayer.ts";
import MathUtils from "@/game-root/utils/MathUtils.ts";
import { BlockCoder } from "@/game-root/block-definitions/BlockCoder.ts";
import { SurvivalCamera } from "@/game-root/player/PlayerCamera.ts";

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
		this.attachFPSDisplay(this.scene);
		this.voxelEngine.registerTexturesAndMaterials(this.scene, [
			{ key: "blocks", path: Assets.blocks.atlas },
		]);
		const { chunkSetting, players } = await this.gameClient.joinWorld(
			this.worldStore.worldId,
			this.playerStore.playerId
		);

		const worldController = this.registerChunk(chunkSetting);

		this.player = new Player(this.scene, this.canvas);
		this.bindEvents(worldController);

		worldController.updateChunk(this.playerStore.origin).then(_ => {
			players.forEach(player => {
				this.loadNPCPlayer(player);
			});
			this.initPlayerPosition(this.player.setPosition.bind(this.player));

			this.voxelEngine.onUpdate(() => {
				let dt = this.voxelEngine.engine.getDeltaTime();
				this.player.update(dt);
			});
			this.voxelEngine.start(this.scene);
		});
	}

	public dispose() {
		this.gameClient.disConnectAll();
		this.player.dispose();
		this.voxelEngine.disposeScene();
		this.worldStore.reset();
		this.playerStore.reset();
		this.npcPlayers.forEach(player => {
			player.dispose();
		});
		this.npcPlayers.clear();
		playerEvents.removeAllListeners();
	}

	public destroy() {
		this.dispose();
		GameWindow.Instance.dispose();
	}

	private loadNPCPlayer(playerId: number) {
		const player = new NpcPlayer(this.scene, playerId);
		player
			.loadModel(Assets.player.models.HumanMale, Assets.player.textures.HumanMaleTexture1)
			.then(model => {
				this.voxelEngine.addMesh(model);
				this.gameClient.playerClient.getPlayerPosition(playerId).then(moveData => {
					if (moveData) {
						const { x, y, z, pitch, yaw } = moveData;
						player.setPosition(x, y, z);
						player.setRotation(yaw, pitch);
					} else {
						this.initPlayerPosition(player.setPosition.bind(player));
					}
				});
			});
		this.npcPlayers.set(playerId, player);
	}

	private bindEvents(worldController: WorldController) {
		const playerClient = this.gameClient.playerClient;

		playerClient.onPlayerJoined(playerId => {
			console.log("playerJoined", playerId);
			this.loadNPCPlayer(playerId);
		});

		playerClient.onPlayerMove(({ playerId, x, y, z, pitch, yaw }) => {
			const player = this.npcPlayers.get(playerId);
			player?.moveTo(x, y, z);
			player?.setRotation(yaw, pitch);
		});

		playerClient.onPlayerLeave(playerId => {
			const player = this.npcPlayers.get(playerId);
			player?.dispose();
		});

		playerClient.onPlaceBlock(blockActionData => {
			worldController.setBlock(blockActionData, blockActionData.blockId);
		});

		this.player.onPlaceBlock(playerClient.sendPlaceBlock.bind(playerClient));

		playerEvents.on(
			"playerMoved",
			throttle((position: any, rotation: any) => {
				worldController.updateChunk(position);
				playerClient.sendPlayerMove({
					playerId: this.playerStore.playerId,
					...position,
					...rotation,
				});
			}, 100)
		);
	}

	private initPlayerPosition(setPosition: (x: number, y: number, z: number) => void) {
		const [x, y, z] = this.worldStore.worldController!.getChunkCenterTop(
			this.playerStore.origin.x,
			this.playerStore.origin.z
		);
		setPosition(x, y + 2, z);
		if (this.player.camera instanceof SurvivalCamera) {
			this.player.camera.isGrounded = false;
		}
	}

	private flatWorldGenerator() {
		const generator = (chunkX: number, chunkZ: number) => {
			const chunkData: ChunkData = {
				blocks: new Uint16Array(65536 / 2),
				shafts: new Uint8Array(256),
				position: {
					x: chunkX,
					z: chunkZ,
				},
			};
			for (let z = 0; z < 16; z++) {
				for (let x = 0; x < 16; x++) {
					// 生成基础地形
					for (let y = 0; y < 128; y++) {
						const id = y == 4 ? 4 : y < 4 ? 3 : 0;
						const index = Chunk.getIndex(x, y, z);
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
						blocks: <Uint16Array>MathUtils.decompressRLE(chunkData.cells),
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
		const blockRegistry = VoxelEngine.registerBlocks(
			combinBlocks,
			BlockCoder.extractId.bind(BlockCoder)
		);
		useBlockStore.setState({ blockRegistry });
	}
}
