import { Engine, Scene, HemisphericLight, Vector3 } from "@babylonjs/core";
import { Inspector } from '@babylonjs/inspector';
import { CreativePlayer } from "@/game-root/player/Player.ts";
import { WorldGenerator } from "@/game-root/world/WorldGenerator.ts";
import SkySystem from "@/game-root/world/SkySystem.ts";
import {World} from "@/game-root/world/World.ts";

export class Game {
    private engine: Engine;
    private scene: Scene;
    private player: CreativePlayer;
    private canvas: HTMLCanvasElement;
    private sky: SkySystem;
    private world : World;

    constructor(canvas: HTMLCanvasElement) {
        console.log("Game started!");
        this.canvas = canvas;


        // 初始化 Babylon 引擎
        this.engine = new Engine(canvas, true, { antialias: true }); // 提高渲染质量
        this.scene = new Scene(this.engine);

        // 添加灯光
        new HemisphericLight("light", new Vector3(0, 10, 0), this.scene);

        // 生成世界
        const wg = new WorldGenerator(this.scene);
        this.world = wg.generateFlatWorld(0);

        // 初始化玩家
        this.player = new CreativePlayer(this.scene, this.canvas,this.world);
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

    private handleResize = () => {
        this.engine.resize();
    };

    dispose() {
        removeEventListener("resize", this.handleResize);
        this.engine.dispose();
    }
}
