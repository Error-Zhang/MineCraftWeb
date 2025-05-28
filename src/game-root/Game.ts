import { Engine, Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { throttle } from "@/game-root/utils/lodash.ts";
import { VoxelEngine } from "@engine/core/VoxelEngine.ts";
import { ChunkData } from "@engine/types/chunk.type.ts";
import { Chunk } from "@engine/chunk/Chunk.ts";
import { blocks, getBlocksMap } from "@/game-root/block-definitions/blocks.ts";
import Assets from "@/game-root/assets";
import { useBlockStore, usePlayerStore, useWorldStore } from "@/store";
import { Player } from "@/game-root/player/Player.ts";
import { blockApi } from "@/api";
import GameWindow from "@/game-root/core/GameWindow.ts";
import { PlayerInputSystem } from "@/game-root/player/PlayerInputSystem.ts";

// import { Inspector } from "@babylonjs/inspector";

export class Game {
	private voxelEngine: VoxelEngine;
	private engine: Engine;
	private scene: Scene;
	private player!: Player;
	private canvas: HTMLCanvasElement;

	constructor(canvas: HTMLCanvasElement) {
		GameWindow.create(canvas);
		const voxel = new VoxelEngine(canvas);
		this.canvas = canvas;
		this.engine = voxel.engine;
		this.scene = voxel.scene;
		this.voxelEngine = voxel;
		this.initBlock();
		this.initChunk();
		this.attachFPSDisplay();
		voxel.onUpdate(() => {
			PlayerInputSystem.Instance.update();
		});
	}

	start() {
		console.log("Starting Game");
		const worldController = useWorldStore.getState().worldController!;
		const playerPos = usePlayerStore.getState().position;

		this.voxelEngine.start();
		worldController.updateChunk(playerPos).then(() => {
			// 更新玩家y轴坐标
			usePlayerStore.getState().move(0, worldController.getColumnHeight(playerPos) + 2, 0);
			this.player = new Player(this.scene, this.canvas);
		});
	}

	dispose() {
		this.voxelEngine.dispose();
		useWorldStore.getState().reset();
		this.player.dispose();
	}

	destroy() {
		this.dispose();
		this.scene.dispose();
		this.engine.dispose();
		GameWindow.Instance.dispose();
	}

	async flatWorldGenerator(chunkX: number, chunkZ: number) {
		const chunkData: ChunkData = {
			blocks: [],
			dirtyBlocks: {},
			position: {
				x: chunkX,
				z: chunkZ,
			},
		};

		// 生成基础地形
		for (let y = 0; y < 64; y++) {
			const id = y == 4 ? 4 : y < 4 ? 3 : 0;
			for (let z = 0; z < 16; z++) {
				for (let x = 0; x < 16; x++) {
					const index = y * 16 * 16 + z * 16 + x;
					chunkData.blocks[index] = id;
				}
			}
		}

		return Chunk.fromJSON(chunkData);
	}

	/**
	 * 在 Canvas 中右上角显示 FPS
	 */
	private attachFPSDisplay() {
		const guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("FPS-UI", true, this.scene);

		const fpsLabel = new TextBlock();
		fpsLabel.color = "white";
		fpsLabel.fontSize = 18;
		fpsLabel.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_RIGHT;
		fpsLabel.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_TOP;
		fpsLabel.paddingRight = 10;
		fpsLabel.paddingTop = 10;

		guiTexture.addControl(fpsLabel);
		// 使用防抖包装 FPS 更新函数
		const updateFPS = throttle(() => {
			fpsLabel.text = `FPS: ${Math.floor(this.engine.getFps())}`;
		}, 1000);

		// 更新 FPS 显示
		this.scene.onBeforeRenderObservable.add(updateFPS);
	}

	private initChunk() {
		const worldController = this.voxelEngine.registerChunk(this.flatWorldGenerator.bind(this), {
			chunkHeight: 64,
		});
		useWorldStore.setState({ worldController });
	}

	private initBlock() {
		blockApi.getBlockTypes().then(blockTypes => {
			useBlockStore.setState({ blockTypes });
			// 验证客户端与服务器之间方块表是否完全匹配
			const blocksMap = getBlocksMap();
			Object.entries(blockTypes.byName).forEach(([blockType, blockId]) => {
				if (blockId === 0) return;
				if (!blocksMap[blockType]) {
					throw new Error(`Block ${blockType} was not defined in website.`);
				}
			});
			console.log("[Game] 方块表匹配成功");
			// 合并方块表:服务器 > 客户端
			const blockRegistry = this.voxelEngine.registerBlock({
				textures: [{ key: "blocks", path: Assets.blocks.atlas }],
				blocks: blocks.map(block => ({
					...block,
					id: blockTypes.byName[block.blockType] ?? block.id,
				})),
			});
			useBlockStore.setState({ blockRegistry });
		});
	}
}
