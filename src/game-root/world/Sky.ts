import { Animation, Mesh, MeshBuilder, Scene } from "@babylonjs/core";
import { SkyMaterial } from "@babylonjs/materials";
import { GameOption } from "@/game-root/Game.ts";

// 天空盒子系统
class Sky {
	private readonly option: GameOption;
	private readonly scene: Scene;
	private readonly skyBox: Mesh;

	constructor(scene: Scene, option: GameOption) {
		this.option = option;
		this.scene = scene;

		// 创建 Sky 材质
		const skyboxMaterial = new SkyMaterial("skyMaterial", this.scene);
		skyboxMaterial.backFaceCulling = false; // 关闭背面剔除，确保内侧可见

		// 计算天空盒尺寸
		const width =
			this.option.bounds.bottomRight.x - this.option.bounds.topLeft.x + this.option.visualField * 2;
		const depth =
			this.option.bounds.bottomRight.z - this.option.bounds.topLeft.z + this.option.visualField * 2;
		const height = 1000; // 高度给一个固定大值，保证玩家仰视时不会穿出天空

		// 创建天空盒 Mesh
		this.skyBox = MeshBuilder.CreateBox("skyBox", { width, height, depth }, this.scene);
		this.skyBox.material = skyboxMaterial;

		// 设置天空盒位置为玩家初始位置
		this.skyBox.position.set(this.option.start.x, -10, this.option.start.z);

		// 初始设置：白天
		this.setSkyConfig("material.inclination", skyboxMaterial.inclination, 0);
	}

	/**
	 * 设置天空属性的动画变化（用于渐变过渡）
	 * @param property 属性名称，例如 "material.inclination"
	 * @param from 起始值
	 * @param to 目标值
	 */
	private setSkyConfig(property: string, from: number, to: number) {
		const keys = [
			{ frame: 0, value: from },
			{ frame: 100, value: to },
		];
		const animation = new Animation(
			"skyAnimation",
			property,
			100, // 帧率
			Animation.ANIMATIONTYPE_FLOAT,
			Animation.ANIMATIONLOOPMODE_CONSTANT
		);
		animation.setKeys(keys);

		// 停止现有动画并开始新的属性动画
		this.scene.stopAnimation(this.skyBox);
		this.scene.beginDirectAnimation(this.skyBox, [animation], 0, 100, false, 1);
	}
}

export default Sky;
