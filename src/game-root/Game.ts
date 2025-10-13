import { Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { throttle } from "@/game-root/utils/lodash.ts";
import { VoxelEngine } from "@engine/core/VoxelEngine.ts";
import { Coords } from "@engine/types/chunk.type.ts";
import { Chunk } from "@engine/chunk/Chunk.ts";
import { getCombinedBlocks } from "@/game-root/block-definitions/blocks.ts";
import Assets from "@/game-root/assets";
import { useBlockStore, useGameStore, usePlayerStore, useWorldStore } from "@/store";
import { Player } from "@/game-root/player/Player.ts";
import { blockApi, worldApi } from "@/ui-root/api";
import GameWindow from "@/game-root/core/GameWindow.ts";
import { PlayerInputSystem } from "@/game-root/player/PlayerInputSystem.ts";
import GameClient from "@/game-root/client/GameClient.ts";
import { playerEvents } from "@/game-root/core/events.ts";
import { IChunkSetting } from "@/game-root/client/interface.ts";
import { WorldController } from "@engine/core/WorldController.ts";
import { NpcPlayer } from "@/game-root/player/NpcPlayer.ts";
import { BlockCoder } from "@/game-root/block-definitions/BlockCoder.ts";
import { LoadingScreen } from "./ui/LoadingScreen";
import VertexBuilderWorker from "./worker/VertexBuilder.worker.ts?worker";
import * as Comlink from "comlink";
import { IVertexBuilder, IVertexBuilderConstructor } from "@/game-root/worker/interface.ts";
import MathUtils from "@/game-root/utils/MathUtils.ts";
import { BlockPlacement } from "@/game-root/managers/BlockPlacement.ts";
import { BlockIconGenerator } from "@engine/block-icon/BlockIconGenerator.ts";
import { BlockDefinition } from "@engine/types/block.type.ts";
import { IChunkData } from "@/ui-root/api/interface.ts";
import { audios } from "@/ui-root/assets/sounds";
import { SimpleAnimalSystem } from "@/game-root/animals/SimpleAnimalSystem";
import { GameConfig } from "@/game-root/config/GameConfig";
import "@/game-root/config/GameConfig.example"; // 加载控制台工具
import { BackgroundMusicManager } from "@/game-root/audio/BackgroundMusicManager";
import { AudioConfig } from "@/game-root/config/AudioConfig";

/**
 * 游戏主类
 * 负责管理游戏的核心系统：渲染引擎、玩家、世界、网络、动物等
 */
export class Game {
	// ==================== 核心组件 ====================
	public canvas: HTMLCanvasElement;
	private voxelEngine: VoxelEngine;
	private scene!: Scene;

	// ==================== 玩家系统 ====================
	private player!: Player;
	private npcPlayers = new Map<number, NpcPlayer>();

	// ==================== 网络系统 ====================
	private gameClient: GameClient = new GameClient();

	// ==================== 动物系统 ====================
	private animalSystem?: SimpleAnimalSystem;

	// ==================== 音频系统 ====================
	private musicManager: BackgroundMusicManager;

	// ==================== Worker系统 ====================
	private worker?: Worker;
	private vertexBuilder?: Comlink.Remote<IVertexBuilder>;

	// ==================== UI系统 ====================
	private screen?: LoadingScreen;

	// ==================== 资源配置 ====================
	private readonly textures = [{ key: "blocks", path: Assets.blocks.atlas }];
	private unsubscribes: Function[] = [];

	/**
	 * 构造函数
	 * 初始化游戏窗口和引擎
	 */
	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		GameWindow.create(canvas);
		this.voxelEngine = new VoxelEngine(canvas);

		// 初始化音乐管理器
		this.musicManager = new BackgroundMusicManager();
		this.musicManager.initialize();

		// 注册方块并生成图标
		this.registerBlocks().then(blockRegistry => {
			this.generateBlockIcons(blockRegistry.getAllBlocks());
		});

		// 注册玩家输入更新
		this.voxelEngine.onUpdate(() => PlayerInputSystem.Instance.update(), false);
	}

	// ==================== Store访问器 ====================

	/** 玩家状态存储 */
	private get playerStore() {
		return usePlayerStore.getState();
	}

	/** 世界状态存储 */
	private get worldStore() {
		return useWorldStore.getState();
	}

	/** 方块状态存储 */
	private get blockStore() {
		return useBlockStore.getState();
	}

	/** 游戏状态存储 */
	private get gameStore() {
		return useGameStore.getState();
	}

	// ==================== 游戏生命周期 ====================

	/**
	 * 启动游戏
	 * 初始化场景、加入世界、创建玩家、设置事件监听
	 */
	public async start() {
		// 1. 创建场景和UI
		this.scene = await this.voxelEngine.createScene();
		this.attachFPSDisplay();
		this.voxelEngine.registerTexturesAndMaterials(this.scene, this.textures);

		// 2. 加入世界并获取配置
		const { chunkSetting, players } = await this.gameClient.joinWorld(
			this.worldStore.worldId,
			this.playerStore.playerId
		);

		// 3. 初始化Worker和世界控制器
		this.vertexBuilder = await this.initWorker(chunkSetting);
		const worldController = this.initWorld(chunkSetting);

		// 4. 监听区块卸载事件
		worldController.onChunkUnload(async chunk => {
			await this.vertexBuilder?.removeChunk(chunk.Key);
		});

		// 5. 创建玩家并设置事件
		this.player = new Player(this.scene, this.canvas);
		this.setupEvents(worldController);

		// 6. 初始化动物系统
		await this.setupAnimals();

		// 7. 启动背景音乐
		this.startBackgroundMusic();

		// 8. 注册玩家更新循环
		this.voxelEngine.onUpdate(() => {
			const dt = this.voxelEngine.engine.getDeltaTime();
			this.player.update(dt);
		});

		// 9. 显示加载界面
		this.showLoadingScreen(worldController);

		// 10. 加载初始区块并生成NPC
		await worldController.updateChunk(this.playerStore.origin);
		players.forEach(p => this.spawnNPC(p));

		// 11. 设置玩家初始位置
		this.setupPlayerPosition();
	}

	/**
	 * 清理游戏资源
	 * 释放所有系统和资源
	 */
	public dispose() {
		this.worker?.terminate();
		this.gameClient.disConnectAll();
		this.player.dispose();
		this.voxelEngine.disposeScene();
		this.worldStore.reset();
		this.playerStore.reset();
		this.npcPlayers.forEach(p => p.dispose());
		this.npcPlayers.clear();
		this.animalSystem?.dispose();
		this.musicManager.stop(); // 停止背景音乐
		playerEvents.removeAllListeners();
		this.unsubscribes.forEach(unsubscribe => unsubscribe());
		this.unsubscribes.length = 0;
		useGameStore.setState({ isGaming: false, isLoading: true });
	}

	/**
	 * 销毁游戏
	 * 清理资源并销毁游戏窗口
	 */
	public destroy() {
		this.dispose();
		this.musicManager.dispose(); // 销毁音乐管理器
		GameWindow.Instance.dispose();
	}

	// ==================== 动物系统初始化 ====================

	/**
	 * 获取音乐管理器
	 * 用于外部控制音乐（音量、切换等）
	 */
	public getMusicManager(): BackgroundMusicManager {
		return this.musicManager;
	}

	/**
	 * 获取场景对象
	 * 用于外部访问Babylon.js场景
	 */
	public getScene(): Scene {
		return this.scene;
	}

	/**
	 * 获取玩家对象
	 */
	public getPlayer(): Player {
		return this.player;
	}

	// ==================== 音频系统 ====================

	/**
	 * 初始化动物系统
	 * 创建动物系统实例、设置网络回调、注册更新循环
	 */
	private async setupAnimals() {
		// 检查配置开关
		if (!GameConfig.isAnimalSystemEnabled()) {
			console.log("[Game] Animal system is disabled by config");
			return;
		}

		const animalClient = this.gameClient.animalClient;

		// 创建动物系统实例并配置网络回调
		this.animalSystem = new SimpleAnimalSystem(this.scene, {
			// 回调1: 请求区块动物数据
			onRequestChunkAnimals: async (chunkX: number, chunkZ: number) => {
				return await animalClient.getChunkAnimals(chunkX, chunkZ);
			},
			// 回调2: 广播动物行为给其他玩家
			onBroadcastBehavior: (animalId: number, behaviorType: string, target, seed: number) => {
				animalClient.broadcastBehavior(animalId, behaviorType, target.x, target.y, target.z, seed);
			},
			// 回调3: 同步动物位置
			onSyncPositions: positions => {
				animalClient.syncPositions(positions);
			},
		});

		// 注册网络事件监听器
		this.setupAnimalNetworkListeners(animalClient);

		// 注册动物系统更新循环
		this.setupAnimalUpdateLoop();

		console.log("[Game] Animal system initialized successfully");
	}

	/**
	 * 设置动物系统网络监听器
	 * 监听来自服务器的动物行为和位置同步事件
	 */
	private setupAnimalNetworkListeners(animalClient: any): void {
		// 监听动物行为事件（移动、逃跑等）
		animalClient.onAnimalBehavior((event: any) => {
			this.animalSystem?.handleBehaviorEvent(
				event.animalId,
				event.behaviorType,
				event.targetX,
				event.targetY,
				event.targetZ,
				event.randomSeed
			);
		});

		// 监听单个动物位置同步
		animalClient.onAnimalPositionSync((sync: any) => {
			this.animalSystem?.handlePositionSync(sync.animalId, sync.x, sync.y, sync.z);
		});

		// 监听批量动物位置同步
		animalClient.onAnimalPositionsSync((syncs: any) => {
			this.animalSystem?.handlePositionsSync(syncs);
		});
	}

	// ==================== 方块和资源管理 ====================

	/**
	 * 设置动物系统更新循环
	 * 在主游戏循环中更新动物AI和物理
	 */
	private setupAnimalUpdateLoop(): void {
		this.voxelEngine.onUpdate(async () => {
			if (!this.animalSystem) return;

			const dt = this.voxelEngine.engine.getDeltaTime();
			const playerPos = (this.player.camera as any).camera.position;

			await this.animalSystem.update(dt, playerPos);
		});
	}

	/**
	 * 启动背景音乐
	 * 游戏开始后延迟播放背景音乐（延迟时间由AudioConfig配置）
	 */
	private startBackgroundMusic(): void {
		if (!AudioConfig.isMusicEnabled()) {
			console.log("[Game] Background music is disabled by config");
			return;
		}

		// 使用配置的延迟时间和音量
		this.musicManager.setVolume(AudioConfig.BACKGROUND_MUSIC.defaultVolume);
		this.musicManager.play(); // 使用默认延迟时间
		console.log(
			`[Game] Background music scheduled (delay: ${AudioConfig.BACKGROUND_MUSIC.playDelay}s, volume: ${AudioConfig.BACKGROUND_MUSIC.defaultVolume})`
		);
	}

	// ==================== Worker和世界初始化 ====================

	/**
	 * 生成方块图标
	 * 为所有方块类型生成预览图标
	 */
	private async generateBlockIcons(blocks: BlockDefinition<any>[]) {
		let count = await BlockIconGenerator.getBlockIconCount();
		if (count === blocks.length) {
			if (!this.gameStore.isInitialized) {
				useGameStore.setState({ isInitialized: true });
			}
			return;
		}
		const blockIconGenerator = new BlockIconGenerator(this.textures);
		for await (const { block, index, total } of blockIconGenerator.generateIconsWithProgress(
			blocks
		)) {
			this.screen?.updateIconText(
				`正在生成图标：${index + 1} / ${total}，当前方块：${block.metaData.displayName}`
			);
			if (index + 1 === total) {
				useGameStore.setState({ isInitialized: true });
			}
		}
	}

	/**
	 * 注册方块类型
	 * 从服务器获取方块定义并注册到引擎
	 */
	private async registerBlocks() {
		const types = await blockApi.getBlockTypes();
		const merged = getCombinedBlocks(types);
		const registry = VoxelEngine.registerBlocks(merged, BlockCoder.extractId.bind(BlockCoder));
		useBlockStore.setState({ blockRegistry: registry, blockTypes: types });
		return registry;
	}

	/**
	 * 初始化Worker线程
	 * 创建顶点构建器Worker用于多线程网格生成
	 */
	private async initWorker(setting: IChunkSetting) {
		this.worker = new VertexBuilderWorker();
		const VertexBuilderClass = Comlink.wrap<IVertexBuilderConstructor>(this.worker);
		const vertexBuilder = await new VertexBuilderClass(setting.chunkSize, setting.chunkHeight);
		await vertexBuilder.addBlocks(this.blockStore.blockTypes!);
		await vertexBuilder.copyWorldStore(JSON.parse(JSON.stringify(useWorldStore.getState())));
		this.voxelEngine?.registerMeshBuilder(vertexBuilder.buildMesh.bind(vertexBuilder));
		return vertexBuilder;
	}

	// ==================== 玩家和NPC管理 ====================

	/**
	 * 初始化世界控制器
	 * 注册区块系统和世界生成器
	 */
	private initWorld(setting: IChunkSetting) {
		const controller = this.voxelEngine.registerChunk(this.getWorldGenerator(), {
			...setting,
			viewDistance: 6, // 经过多次测试6是最稳定的值
		});
		useWorldStore.setState({ worldController: controller });
		useWorldStore.setState({ chunkSetting: setting });
		return controller;
	}

	/**
	 * 获取世界生成器
	 * 根据世界类型（平坦/正常）返回对应的生成器
	 */
	private getWorldGenerator() {
		const processChunkData = async (raw: IChunkData[], isRLE: boolean) => {
			const chunkDatas = raw.map(data => ({
				blocks: isRLE
					? <Uint16Array>MathUtils.decompressRLE(data.cells)
					: Uint16Array.from(data.cells),
				shafts: isRLE
					? <Uint8Array>MathUtils.decompressRLE(data.shafts)
					: Uint8Array.from(data.shafts),
				position: { x: data.x, z: data.z },
			}));
			await this.vertexBuilder?.addChunks(chunkDatas);
			return chunkDatas.map(chunkData => Chunk.fromJSON(chunkData));
		};
		const isFlat = this.worldStore.worldMode === 2;
		const generator = isFlat ? worldApi.generateFlatWorld : worldApi.generateChunks;
		return async (coords: Coords) => {
			const raw = await generator(this.worldStore.worldId, coords);
			return processChunkData(raw, !isFlat);
		};
	}

	// ==================== 事件系统 ====================

	/**
	 * 生成NPC玩家
	 * 创建其他玩家的角色模型
	 */
	private spawnNPC(playerId: number) {
		const npc = new NpcPlayer(this.scene, playerId);
		npc
			.loadModel(Assets.player.models.HumanMale, Assets.player.textures.HumanMaleTexture1)
			.then(model => {
				this.voxelEngine.addMesh(model);
				this.gameClient.playerClient.getPlayerPosition(playerId).then(pos => {
					if (pos) {
						npc.setPosition(pos.x, pos.y, pos.z);
						npc.setRotation(pos.pitch, pos.yaw);
					} else this.setupPlayerPosition(npc.setPosition.bind(npc));
				});
			});
		this.npcPlayers.set(playerId, npc);
		audios.Message.play();
	}

	// ==================== UI系统 ====================

	/**
	 * 设置玩家初始位置
	 * 将玩家放置在出生点区块的中心顶部
	 */
	private setupPlayerPosition(setPos?: (x: number, y: number, z: number) => void) {
		const [x, y, z] = this.worldStore.worldController!.getChunkCenterTop(
			this.playerStore.origin.x,
			this.playerStore.origin.z
		);
		(setPos ?? this.player.setPosition.bind(this.player))(x, y + 3, z);
	}

	/**
	 * 设置游戏事件监听
	 * 监听玩家移动、方块放置、网络事件等
	 */
	private setupEvents(world: WorldController) {
		const client = this.gameClient.playerClient;
		const placer = new BlockPlacement(world, this.vertexBuilder);
		this.voxelEngine.onUpdate(() => {
			placer.update();
		});
		client.onPlayerJoined(id => this.spawnNPC(id));
		client.onPlayerTranslate(({ playerId, x, y, z }) => {
			this.npcPlayers.get(playerId)?.moveTo(x, y, z);
		});
		client.onPlayerRotate(({ playerId, pitch, yaw }) => {
			this.npcPlayers.get(playerId)?.setRotation(pitch, yaw);
		});
		client.onPlayerLeave(id => this.npcPlayers.get(id)?.dispose());

		client.onPlaceBlock(async data => {
			placer.enqueuePlacement(data);
		});

		this.player.onPlaceBlock(client.sendPlaceBlock.bind(client));

		playerEvents.on(
			"playerTranslated",
			throttle(pos => {
				world.updateChunk(pos);
				client.sendPlayerTranslate({
					playerId: this.playerStore.playerId,
					x: pos.x,
					y: pos.y,
					z: pos.z,
				});
			}, 100)
		);
		playerEvents.on(
			"playerRotated",
			throttle(rot => {
				client.sendPlayerRotate({
					playerId: this.playerStore.playerId,
					yaw: rot.yaw,
					pitch: rot.pitch,
				});
			}, 100)
		);
	}

	// ==================== 公共访问器 ====================

	/**
	 * 附加FPS显示
	 * 在屏幕右上角显示帧率
	 */
	private attachFPSDisplay() {
		const gui = AdvancedDynamicTexture.CreateFullscreenUI("FPS-UI", true, this.scene);
		const label = new TextBlock();
		label.color = "white";
		label.fontSize = 18;
		label.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_RIGHT;
		label.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_TOP;
		label.paddingRight = 10;
		label.paddingTop = 10;
		gui.addControl(label);
		const update = throttle(() => {
			label.text = `FPS: ${Math.floor(this.voxelEngine.engine.getFps())}`;
		}, 1000);
		this.scene.onBeforeRenderObservable.add(update);
	}

	/**
	 * 显示加载界面
	 * 显示世界加载进度和方块图标生成进度
	 */
	private showLoadingScreen(worldController: WorldController) {
		const screen = new LoadingScreen(this.scene);
		const enterToWorld = () => {
			useGameStore.setState({ isLoading: false });
			screen.dispose();
			worldController.offChunkUpdated(id);
			this.voxelEngine.start(this.scene);
		};
		const id = worldController.onChunkUpdated(progress => {
			screen.update({
				worldName: this.worldStore.worldHost,
				seasonId: this.worldStore.season,
				time: "12:00",
				progress,
			});
			this.scene.render();
			if (progress === 1) {
				if (this.gameStore.isInitialized) {
					enterToWorld();
				} else {
					const unsub = useGameStore.subscribe((state, prevState) => {
						if (state.isInitialized && state.isInitialized !== prevState.isInitialized) {
							enterToWorld();
						}
					});
					this.unsubscribes.push(unsub);
				}
			}
		});
		this.screen = screen;
	}
}
