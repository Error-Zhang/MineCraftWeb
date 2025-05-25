import { Animation, Color3, HemisphericLight, Mesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import { SkyMaterial } from "@babylonjs/materials";
import { GameTime } from "../systems/GameTime";

/**
 * 天空系统类
 * 负责管理天空盒子、太阳、月亮和光照
 */
class Sky {
	public static readonly Size: number = 1024;
	public static readonly MinUpdateDistance = this.Size * 0.8;

	private readonly scene: Scene;
	private readonly skyBox: Mesh;
	private readonly gameTime: GameTime;
	private readonly skyMaterial: SkyMaterial;
	private readonly light: HemisphericLight;
	private sun!: Mesh;
	private moon!: Mesh;
	private readonly dayLength: number = 1200; // 一天的长度（秒）

	constructor(scene: Scene, gameTime: GameTime) {
		this.scene = scene;
		this.gameTime = gameTime;

		// 创建 Sky 材质
		this.skyMaterial = new SkyMaterial("skyMaterial", this.scene);
		this.skyMaterial.backFaceCulling = false;

		// 创建天空盒 Mesh
		this.skyBox = MeshBuilder.CreateBox(
			"skyBox",
			{ width: Sky.Size, height: Sky.Size, depth: Sky.Size },
			this.scene
		);
		this.skyBox.material = this.skyMaterial;
		this.setSkyConfig("material.inclination", this.skyMaterial.inclination, 0);
		// 创建光照
		this.light = new HemisphericLight("Light", new Vector3(0, 1, 0), this.scene);
		this.light.intensity = 0.7;
		this.light.specular = new Color3(0, 0, 0);
		this.light.groundColor = new Color3(0.2, 0.2, 0.2);
	}

	public updatePosition(x: number, z: number) {
		this.skyBox.position.set(x, 0, z);
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
