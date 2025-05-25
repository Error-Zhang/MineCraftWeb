import { Engine, Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { throttle } from "@/game-root/utils/lodash.ts";
import { VoxelEngine } from "@engine/core/VoxelEngine.ts";
import { ChunkData } from "@engine/types/chunk.type.ts";
import { Chunk } from "@engine/chunk/Chunk.ts";
import blocks from "@/game-root/block-definitions/blocks.ts";
import Assets from "@/game-root/assets";
import { usePlayerStore, useWorldStore } from "@/store";
import { Player } from "@/game-root/player/Player.ts";

// import { Inspector } from "@babylonjs/inspector";

export class Game {
	private voxelEngine: VoxelEngine;
	private engine: Engine;
	private scene: Scene;
	private player: Player | undefined;
	private canvas: HTMLCanvasElement;

	constructor(canvas: HTMLCanvasElement) {
		const voxel = new VoxelEngine(canvas);
		this.canvas = canvas;
		this.engine = voxel.engine;
		this.scene = voxel.scene;

		voxel.registerBlock({
			textures: [{ key: "blocks", path: Assets.blocks.atlas }],
			blocks,
		});

		this.voxelEngine = voxel;
		this.attachFPSDisplay();
	}

	start() {
		const worldController = this.voxelEngine.registerChunk(this.flatWorldGenerator.bind(this), {
			chunkHeight: 64,
		});
		useWorldStore.setState({ worldController });
		const playerPos = usePlayerStore.getState().position;

		this.voxelEngine.start();
		worldController.updateChunk(playerPos.x, playerPos.z).then(() => {
			// 更新玩家y轴坐标
			usePlayerStore.setState({
				position: {
					...playerPos,
					y: worldController.getColumnHeight(playerPos.x, playerPos.z) + 2,
				},
			});
			this.player = new Player(this.scene, this.canvas);
		});
	}

	dispose() {
		this.voxelEngine.disposeWorld();
		useWorldStore.getState().reset();
		this.player?.dispose();
	}

	destroy() {
		this.dispose();
		this.scene.dispose();
		this.engine.dispose();
	}

	async flatWorldGenerator(chunkX: number, chunkZ: number) {
		const chunkData: ChunkData = {
			blocks: new Array(16 * 16 * 64).fill(0),
			dirtyBlocks: {},
			position: {
				x: chunkX,
				z: chunkZ,
			},
		};

		// 生成基础地形
		for (let y = 0; y < 64; y++) {
			const id = y == 4 ? 1 : y < 4 ? 2 : 0;
			for (let z = 0; z < 16; z++) {
				for (let x = 0; x < 16; x++) {
					const index = y * 16 * 16 + z * 16 + x;
					chunkData.blocks[index] = id;
				}
			}
		}

		// 在表面添加随机装饰方块
		const surfaceY = 5; // 表面层高度
		const decorationBlocks = [3, 4, 5]; // 装饰方块的ID列表
		const decorationChance = 0.1; // 10%的概率生成装饰方块

		for (let z = 0; z < 16; z++) {
			for (let x = 0; x < 16; x++) {
				if (Math.random() < decorationChance) {
					const randomBlockId =
						decorationBlocks[Math.floor(Math.random() * decorationBlocks.length)];
					const index = surfaceY * 16 * 16 + z * 16 + x;
					chunkData.blocks[index] = randomBlockId;
				}
			}
		}

		return Chunk.fromJSON(chunkData);
	}

	/**
	 * 在 Canvas 中右上角显示 FPS
	 */
	attachFPSDisplay() {
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
}
