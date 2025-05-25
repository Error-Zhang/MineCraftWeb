import { Effect, Engine, Scene, Vector3 } from "@babylonjs/core";
import { ChunkManager } from "../chunk/ChunkManager";
import { BlockRegistry } from "../block/BlockRegistry";
import { BlockDefinition, BlockProperties } from "../types/block.type.ts";
import { BlockMaterialManager, BlockTextureManager } from "../renderer/BlockMaterialManager.ts";
import { WorldRenderer } from "../renderer/WorldRenderer";
import { waterFragmentShader, waterVertexShader } from "../shaders/water";
import { lavaFragmentShader, lavaVertexShader } from "../shaders/lava";
import { Chunk } from "../chunk/Chunk.ts";
import Sky from "../environment/Sky.ts";
import { WorldController } from "./WorldController.ts";
import { GameTime } from "../systems/GameTime";
// 注册着色器
Effect.ShadersStore["waterVertexShader"] = waterVertexShader;
Effect.ShadersStore["waterFragmentShader"] = waterFragmentShader;
Effect.ShadersStore["lavaVertexShader"] = lavaVertexShader;
Effect.ShadersStore["lavaFragmentShader"] = lavaFragmentShader;

/** 插件接口，用于注入生命周期钩子 */
export interface EnginePlugin {
	onInit?(engine: VoxelEngine): void;

	onTick?(): void;

	onDispose?(): void;
}

export class VoxelEngine {
	public readonly engine: Engine;
	public readonly scene: Scene;
	public readonly gameTime: GameTime;

	private readonly blockRegistry: BlockRegistry;
	private readonly worldRenderer: WorldRenderer;
	private readonly sky: Sky;

	private animationCallbacks: Set<() => void> = new Set();
	private disposers: (() => void)[] = [];
	private plugins: EnginePlugin[] = [];

	constructor(canvas: HTMLCanvasElement) {
		this.engine = new Engine(canvas, true);
		this.scene = new Scene(this.engine);
		this.scene.gravity = new Vector3(0, -0.1, 0);
		this.scene.collisionsEnabled = true;

		this.gameTime = new GameTime();
		// 设置游戏时间为正午（12:00）
		this.gameTime.setTime(12 * 3600); // 12小时 * 3600秒
		this.sky = new Sky(this.scene, this.gameTime);

		this.blockRegistry = BlockRegistry.Instance;
		this.worldRenderer = new WorldRenderer(this.scene);

		this.onUpdate(() => {
			ChunkManager.Instance.forEachBlockEntity(entity => {
				entity.tick?.();
			});
			// 更新游戏时间
			this.gameTime.update(this.engine.getDeltaTime() / 1000);
		});
	}

	public disposeWorld() {
		for (const dispose of this.disposers) dispose();
		for (const plugin of this.plugins) plugin.onDispose?.();
		this.animationCallbacks.clear();
		ChunkManager.Instance.dispose();
		this.worldRenderer.dispose();
	}

	public onUpdate(callback: () => void): () => void {
		this.animationCallbacks.add(callback);
		const disposer = () => this.animationCallbacks.delete(callback);
		this.disposers.push(disposer);
		return disposer;
	}

	public registerPlugin(plugin: EnginePlugin) {
		this.plugins.push(plugin);
		plugin.onInit?.(this);
	}

	public start() {
		this.engine.runRenderLoop(() => {
			for (const cb of this.animationCallbacks) cb();
			for (const plugin of this.plugins) plugin.onTick?.();
			this.scene.render();
		});

		const resizeListener = () => this.engine.resize();
		window.addEventListener("resize", resizeListener);
		this.disposers.push(() => window.removeEventListener("resize", resizeListener));
	}

	public registerBlock({
		textures,
		blocks,
	}: {
		textures: { key: string; path: string }[];
		blocks: BlockDefinition<Record<string, any>>[];
		blockProperties?: Record<string, BlockProperties>;
	}) {
		BlockTextureManager.registerTextures(this.scene, textures);
		this.blockRegistry.registerBlocks(blocks);
		BlockMaterialManager.initializePresetMaterials();
		console.log("[VoxelEngine] 方块注册完成");
	}

	public registerChunk(
		chunkGenerator: (x: number, y: number) => Promise<Chunk>,
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
		const chunkManager = ChunkManager.create(chunkGenerator, this.worldRenderer);
		console.log("[VoxelEngine] 区块注册完成");
		return new WorldController(chunkManager, this.sky);
	}
}
