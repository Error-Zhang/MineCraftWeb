import { AbstractMesh, Effect, Engine, Scene } from "@babylonjs/core";
import { ChunkManager } from "../chunk/ChunkManager";
import { BlockRegistry } from "../block/BlockRegistry";
import { BlockDefinition } from "../types/block.type.ts";
import {
	BlockMaterialManager,
	BlockTextureManager,
	MaterialConfig,
} from "../renderer/BlockMaterialManager.ts";
import { MeshBuilderFun, WorldRenderer } from "../renderer/WorldRenderer";
import { waterFragmentShader, waterVertexShader } from "../shaders/water";
import { lavaFragmentShader, lavaVertexShader } from "../shaders/lava";
import { Chunk } from "../chunk/Chunk.ts";
import { Environment } from "../environment/Environment.ts";
import { WorldController } from "./WorldController.ts";
import { GameTime } from "../systems/GameTime";
import { Coords } from "@engine/types/chunk.type.ts";
import { Singleton } from "@engine/core/Singleton.ts";
import { WorldContext } from "@engine/core/WorldContext.ts";
// 注册着色器
Effect.ShadersStore["waterVertexShader"] = waterVertexShader;
Effect.ShadersStore["waterFragmentShader"] = waterFragmentShader;
Effect.ShadersStore["lavaVertexShader"] = lavaVertexShader;
Effect.ShadersStore["lavaFragmentShader"] = lavaFragmentShader;

export class VoxelEngine {
	public readonly engine: Engine;
	public scene?: Scene;

	private animationCallbacks: Set<() => void> = new Set();
	private disposers: (() => void)[] = [];
	private _worldContext!: WorldContext;
	private gameTime?: GameTime;
	private environment?: Environment;
	private worldRenderer?: WorldRenderer;
	private chunkManager?: ChunkManager;

	constructor(canvas: HTMLCanvasElement) {
		this.engine = new Engine(canvas, true);
		window.addEventListener("resize", this.resizeListener.bind(this));
	}

	public static registerBlocks(
		blocks: BlockDefinition<Record<string, any>>[],
		decodeId?: (value: number) => number
	) {
		const blockRegistry: BlockRegistry = Singleton.create(BlockRegistry, decodeId);
		blockRegistry.registerBlocks(blocks);
		console.log("[VoxelEngine] 方块注册完成");
		return blockRegistry;
	}

	public disposeScene() {
		for (const dispose of this.disposers) dispose();
		this.engine.stopRenderLoop();
		this._worldContext?.disposeAll();
		this.clearCanvas();
		console.log("[VoxelEngine] 场景已释放");
	}

	public clearCanvas() {
		const gl = this.engine._gl;
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}

	public destroy() {
		this.disposeScene();
		this.engine.dispose();
		this.animationCallbacks.clear();
		window.removeEventListener("resize", this.resizeListener.bind(this));
		console.log("[VoxelEngine] 引擎已销毁");
	}

	public onUpdate(callback: () => void, dispose: (() => void) | boolean = true): () => void {
		this.animationCallbacks.add(callback);
		if (dispose instanceof Function) this.disposers.push(dispose);
		// 创建取消订阅的函数
		const disposer = () => {
			if (dispose) {
				this.animationCallbacks.delete(callback);
			}
		};
		this.disposers.push(disposer);
		return disposer;
	}

	public createScene() {
		this.clearCanvas();
		const scene = new Scene(this.engine);
		this._worldContext = new WorldContext(scene);
		this.registerWorldRelative(scene);
		this.scene = scene;
		return scene;
	}

	public start(scene: Scene) {
		this.onUpdate(() => {
			// 更新游戏时间
			this.gameTime?.update(this.engine.getDeltaTime() / 1000);
			this.environment?.updateLighting();
		});
		this.engine.runRenderLoop(() => {
			scene.render();
			for (const cb of this.animationCallbacks) cb();
		});
	}

	public registerTexturesAndMaterials(
		scene: Scene,
		textures: { key: string; path: string }[],
		materials?: {
			key: string;
			material: MaterialConfig;
		}[]
	) {
		const blockTextureManager: BlockTextureManager = Singleton.create(BlockTextureManager, scene);
		blockTextureManager.registerTextures(textures);
		const blockMaterialManager: BlockMaterialManager = Singleton.create(
			BlockMaterialManager,
			scene
		);
		BlockMaterialManager.registerCustomMaterials(materials || []);
		this._worldContext.add(blockTextureManager);
		this._worldContext.add(blockMaterialManager);
		console.log("[VoxelEngine] 纹理材质注册完成");
		return { blockTextureManager, blockMaterialManager };
	}

	public addMesh(mesh: AbstractMesh) {
		this.environment?.shadowGenerator?.addShadowCaster(mesh);
		this.scene?.addMesh(mesh);
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
		chunkSize && (Chunk.Size = chunkSize);
		chunkHeight && (Chunk.Height = chunkHeight);
		viewDistance && (ChunkManager.ViewDistance = viewDistance);
		this.chunkManager = Singleton.create(ChunkManager, chunkGenerator);
		this._worldContext.add(this.chunkManager);
		this.onUpdate(() => {
			this.chunkManager!.forEachBlockEntity(entity => {
				entity.tick?.();
			});
		});
		console.log("[VoxelEngine] 区块注册完成");
		return new WorldController(this.chunkManager, this.environment!);
	}

	public registerMeshBuilder(meshBuilderFun: MeshBuilderFun) {
		this.worldRenderer?.registerBuildMeshFun(meshBuilderFun);
	}

	private resizeListener = () => this.engine.resize();

	private registerWorldRelative(scene: Scene) {
		this.gameTime = Singleton.create(GameTime);
		this._worldContext.add(this.gameTime);
		this.environment = Singleton.create(Environment, scene);
		this._worldContext.add(this.environment);
		this.worldRenderer = Singleton.create(WorldRenderer, scene);
		this._worldContext.add(this.worldRenderer);
	}
}
