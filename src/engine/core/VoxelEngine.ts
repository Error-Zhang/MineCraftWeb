import { Effect, Engine, Scene, Vector3 } from "@babylonjs/core";
import { ChunkManager } from "../chunk/ChunkManager";
import { BlockRegistry } from "../block/BlockRegistry";
import { BlockDefinition } from "../types/block.type.ts";
import { BlockMaterialManager, BlockTextureManager } from "../renderer/BlockMaterialManager.ts";
import { WorldRenderer } from "../renderer/WorldRenderer";
import { waterFragmentShader, waterVertexShader } from "../shaders/water";
import { lavaFragmentShader, lavaVertexShader } from "../shaders/lava";
import { Chunk } from "../chunk/Chunk.ts";
import Sky from "../environment/Sky.ts";
import { WorldController } from "./WorldController.ts";
import { GameTime } from "../systems/GameTime";
import { LiquidManager } from "../liquid/LiquidManager";
import { Coords } from "@engine/types/chunk.type.ts";
import { Singleton } from "@engine/core/Singleton.ts";
// 注册着色器
Effect.ShadersStore["waterVertexShader"] = waterVertexShader;
Effect.ShadersStore["waterFragmentShader"] = waterFragmentShader;
Effect.ShadersStore["lavaVertexShader"] = lavaVertexShader;
Effect.ShadersStore["lavaFragmentShader"] = lavaFragmentShader;

export class VoxelEngine {
	public readonly engine: Engine;
	public gameTime!: GameTime;

	private blockRegistry!: BlockRegistry;
	private chunkManager!: ChunkManager;
	private worldRenderer!: WorldRenderer;
	private sky!: Sky;
	private liquidManager!: LiquidManager;

	private animationCallbacks: Set<() => void> = new Set();
	private disposers: (() => void)[] = [];

	constructor(canvas: HTMLCanvasElement) {
		this.engine = new Engine(canvas, true);
		const resizeListener = () => this.engine.resize();
		window.addEventListener("resize", resizeListener);
		this.disposers.push(() => window.removeEventListener("resize", resizeListener));

		BlockMaterialManager.initializePresetMaterials();
	}

	public dispose() {
		for (const dispose of this.disposers) dispose();
		ChunkManager.Instance.dispose();
		this.worldRenderer.dispose();
		this.engine.stopRenderLoop();
	}

	public destroy() {
		this.dispose();
		this.engine.dispose();
		this.animationCallbacks.clear();
	}

	public onUpdate(callback: () => void): () => void {
		this.animationCallbacks.add(callback);
		const disposer = () => this.animationCallbacks.delete(callback);
		this.disposers.push(disposer);
		return disposer;
	}

	public createScene() {
		const scene = new Scene(this.engine);
		scene.gravity = new Vector3(0, -0.1, 0);
		scene.collisionsEnabled = true;
		this.gameTime = new GameTime();
		// 设置游戏时间为正午（12:00）
		this.gameTime.setTime(12 * 3600);
		this.sky = new Sky(scene, this.gameTime);
		this.worldRenderer = new WorldRenderer(scene);
		return scene;
	}

	public start(scene: Scene) {
		this.onUpdate(() => {
			// 更新游戏时间
			this.gameTime.update(this.engine.getDeltaTime() / 1000);
		});
		this.engine.runRenderLoop(() => {
			scene.render();
			for (const cb of this.animationCallbacks) cb();
		});
	}

	public loadTextures(scene: Scene, textures: { key: string; path: string }[]) {
		BlockTextureManager.registerTextures(scene, textures);
	}

	public registerBlocks(blocks: BlockDefinition<Record<string, any>>[]) {
		this.blockRegistry = Singleton.create(BlockRegistry);
		this.blockRegistry.registerBlocks(blocks);
		console.log("[VoxelEngine] 方块注册完成");
		return this.blockRegistry;
	}

	public registerChunk(
		chunkGenerator: (coords: Coords) => Promise<Chunk[]>,
		{
			chunkSize,
			chunkHeight,
			viewDistance,
		}: {
			chunkSize?: number;
			chunkHeight?: number;
			viewDistance?: number;
		} = {}
	) {
		chunkSize && (ChunkManager.ChunkSize = chunkSize);
		chunkHeight && (ChunkManager.ChunkHeight = chunkHeight);
		viewDistance && (ChunkManager.LoadDistance = viewDistance);
		this.chunkManager = Singleton.create(ChunkManager, chunkGenerator, this.worldRenderer);
		this.onUpdate(() => {
			this.chunkManager.forEachBlockEntity(entity => {
				entity.tick?.();
			});
		});
		console.log("[VoxelEngine] 区块注册完成");
		return new WorldController(this.chunkManager, this.sky);
	}
}
