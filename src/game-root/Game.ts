import { Engine, Scene, Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { Player } from "@/game-root/player/Player.ts";
import WorldGenerator from "@/game-root/world/WorldGenerator.ts";
import Sky from "@/game-root/world/Sky.ts";
import { World } from "@/game-root/world/World.ts";
import Light from "@/game-root/world/Light.ts";
import { gameEventBus } from "@/game-root/events/GameEventBus.ts";
import { GameEvents } from "@/game-root/events/GameEvents.ts";
import { Position } from "@/game-root/world/Chunk.ts";
import { throttle } from "@/game-root/utils/lodash.ts";
// import { Inspector } from "@babylonjs/inspector";

// 游戏配置类型
export type GameOption = {
	seed: number;
	gameMode: string;
	worldMode: string;
	start: Position; // 初始位置
	bounds: {
		topLeft: { x: number; z: number };
		bottomRight: { x: number; z: number };
	};
	visualField: number; // 视野范围（扩展天空盒范围）
};

export class Game {
	private engine: Engine;
	private scene: Scene;
	private player?: Player;
	private canvas: HTMLCanvasElement;
	private sky: Sky;
	private world?: World;
	private worldReady: Promise<void>;

	constructor(canvas: HTMLCanvasElement, option: GameOption) {
		console.log("Game started!");
		this.canvas = canvas;

		// 初始化 Babylon 引擎
		this.engine = new Engine(canvas, false); // 取消抗锯齿防止边缘柔化
		this.scene = new Scene(this.engine);
		this.scene.gravity = new Vector3(0, -0.1, 0); // 重力
		this.scene.collisionsEnabled = true; // 启动碰撞
		// 添加灯光
		new Light(this.scene);
		this.sky = new Sky(this.scene, option);
		// 生成世界
		const wg = new WorldGenerator(this.scene, option);
		this.worldReady = wg.generateWorldParallel().then(world => {
			this.world = world;
			const height = world.getHeightAt(option.start);
			// 更新玩家高度，防止卡墙
			option.start.y += height;
			this.player = new Player(this.scene, this.canvas, world, option);
			gameEventBus.on(GameEvents.playerMove, ({ location }: { location: Position }) => {
				wg.updateWorldAround(location, world);
			});
		});
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

	public showInspector() {
		// 显示 debug 面板（可选）
		// Inspector.Show(this.scene, {});
	}

	public async start() {
		await this.worldReady;
		this.engine.setHardwareScalingLevel(1); // 你可以尝试调整硬件缩放级别

		// 开始渲染循环
		this.engine.runRenderLoop(() => {
			this.scene.render();
		});

		this.attachFPSDisplay();
		// 监听窗口大小变化
		window.addEventListener("resize", this.handleResize.bind(this));
	}

	dispose() {
		this.player?.dispose();
		this.engine.dispose();
		window.removeEventListener("resize", this.handleResize.bind(this));
	}

	private handleResize = () => {
		this.engine.resize();
	};
}
