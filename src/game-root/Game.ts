import { Engine, HemisphericLight, Scene, Vector3 } from "@babylonjs/core";
import { Player } from "@/game-root/player/Player.ts";
import WorldGenerator from "@/game-root/world/WorldGenerator.ts";
import SkySystem from "@/game-root/world/SkySystem.ts";
import { World } from "@/game-root/world/World.ts";
import GameStore from "@/game-root/events/GameStore.ts";
import TreeGenerator from "@/game-root/world/TreeGenerator.ts";

export class Game {
	private engine: Engine;
	private scene: Scene;
	private player: Player | undefined;
	private canvas: HTMLCanvasElement;
	private sky: SkySystem;
	private world: World;

	constructor(canvas: HTMLCanvasElement) {
		console.log("GameListener started!");
		this.canvas = canvas;

		// 初始化 Babylon 引擎
		this.engine = new Engine(canvas, false); // 取消抗锯齿防止边缘柔化
		this.scene = new Scene(this.engine);

		// 添加灯光
		const light = new HemisphericLight("light", new Vector3(10, 10, 10), this.scene);

		// 生成世界
		const wg = new WorldGenerator(this.scene);
		this.world = wg.generateFlatWorld(1);
		const tg = new TreeGenerator(this.scene, this.world);
		tg.generateTree(new Vector3(-2, 0, -2));

		// 初始化玩家
		GameStore.on("gameMode", gameMode => {
			this.player = new Player(this.scene, this.canvas, this.world, gameMode);
		});

		this.sky = new SkySystem(this.scene);

		// 开始渲染循环
		this.engine.runRenderLoop(() => {
			// const deltaTime = this.engine.getDeltaTime() / 1000; // 秒
			// this.sky.update(deltaTime); // 每帧推进一点时间

			this.scene.render();
		});

		// 显示 debug 面板（可选）
		// Inspector.Show(this.scene, {});

		// 监听窗口大小变化
		addEventListener("resize", this.handleResize);
	}

	dispose() {
		removeEventListener("resize", this.handleResize);
		this.player?.dispose();
		this.engine.dispose();
	}

	private handleResize = () => {
		this.engine.resize();
	};
}
