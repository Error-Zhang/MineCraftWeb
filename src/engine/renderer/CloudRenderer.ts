import {
	AnimationGroup,
	Color3,
	Engine,
	Mesh,
	Scene,
	StandardMaterial,
	Texture,
	Vector3,
	VertexData,
} from "@babylonjs/core";
import { WeatherSystem } from "../systems/WeatherSystem.ts";
import { GameTime } from "@engine/systems/GameTime.ts";
import { Environment } from "../environment/Environment.ts";
import Clouds from "../environment/assets/Clouds.webp";

/**
 * 云层顶点数据结构
 */
interface CloudVertex {
	position: Vector3;
	texCoord: Vector3;
	color: Color3;
}

/**
 * 云层配置接口
 */
interface CloudLayerConfig {
	height: number; // 云层高度
	color: Color3; // 云层颜色
	opacity: number; // 云层透明度
}

/**
 * 云层渲染器 - 基于生存战争的多层云层系统
 */
export class CloudRenderer {
	private scene: Scene;
	private gameTime: GameTime;
	private weatherSystem: WeatherSystem;

	// 云层配置（模仿生存战争的多层结构）
	private cloudLayers: CloudLayerConfig[] = [
		{
			height: 800,
			color: new Color3(1, 1, 1),
			opacity: 0.8,
		},
		{
			height: 600,
			color: new Color3(0.95, 0.95, 1),
			opacity: 0.7,
		},
		{
			height: 400,
			color: new Color3(0.9, 0.9, 0.95),
			opacity: 0.6,
		},
	];

	private cloudMeshes: Mesh[] = [];
	private cloudMaterials: StandardMaterial[] = [];
	private cloudAnimations: AnimationGroup[] = [];

	// 环境适应参数
	private baseOpacity: number = 0.8; // 基础透明度
	private weatherIntensity: number = 0; // 天气强度（影响云层密度）
	private timeOfDay: number = 0; // 时间（影响云层颜色）

	constructor(scene: Scene) {
		this.scene = scene;
		this.gameTime = GameTime.getInstance();
		this.weatherSystem = WeatherSystem.Instance;

		this.initializeCloudSystem();
	}

	/**
	 * 更新云层环境适应性（模仿生存战争的环境适应机制）
	 */
	public updateEnvironmentAdaptation(): void {
		// 更新时间相关参数
		this.timeOfDay = this.gameTime.dayProgress;

		// 从天气系统获取真实天气数据
		this.weatherIntensity = this.weatherSystem.getPrecipitationIntensity();

		// 更新每层云层的属性
		for (let i = 0; i < this.cloudLayers.length; i++) {
			const layer = this.cloudLayers[i];
			const material = this.cloudMaterials[i];

			// 根据时间和天气调整透明度（模仿生存战争的光照和天气影响）
			const timeFactor = this.calculateTimeFactor();
			const weatherFactor = 1 + this.weatherIntensity * 0.3; // 天气增加云层密度
			const heightFactor = 1 - i * 0.2; // 高度越低透明度越高

			const newOpacity =
				this.baseOpacity * timeFactor * weatherFactor * heightFactor * layer.opacity;
			material.alpha = Math.max(0.1, Math.min(1.0, newOpacity));

			// 根据时间调整颜色（模仿生存战争的天空颜色变化）
			const colorIntensity = this.calculateColorIntensity();
			const adjustedColor = layer.color.scale(colorIntensity);
			material.emissiveColor = adjustedColor;
		}
	}

	/**
	 * 开始云层动画
	 */
	public startAnimations(): void {
		for (const animation of this.cloudAnimations) {
			animation.start(true);
		}
	}

	/**
	 * 停止云层动画
	 */
	public stopAnimations(): void {
		for (const animation of this.cloudAnimations) {
			animation.stop();
		}
	}

	/**
	 * 销毁云层系统
	 */
	public dispose(): void {
		this.stopAnimations();

		for (const mesh of this.cloudMeshes) {
			mesh.dispose();
		}
		this.cloudMeshes = [];

		for (const material of this.cloudMaterials) {
			material.dispose();
		}
		this.cloudMaterials = [];

		this.cloudAnimations = [];

		console.log("[CloudRenderer] 云层系统已销毁");
	}

	/**
	 * 初始化云层系统
	 */
	private initializeCloudSystem(): void {
		// 创建云层纹理
		this.createCloudMaterials();

		// 创建云层网格
		this.createCloudMeshes();

		console.log("[CloudRenderer] 云层系统初始化完成");
	}

	/**
	 * 创建云层材质
	 */
	private createCloudMaterials(): void {
		// 加载云层纹理
		const texture = new Texture(Clouds, this.scene);

		// 为每层云层存储纹理引用
		for (let i = 0; i < this.cloudLayers.length; i++) {
			this.cloudMaterials[i] = new StandardMaterial(`cloudMaterial_${i}`, this.scene);
			this.cloudMaterials[i].opacityTexture = texture;
			this.cloudMaterials[i].backFaceCulling = false;
			this.cloudMaterials[i].alpha = this.cloudLayers[i].opacity;
			this.cloudMaterials[i].alphaMode = Engine.ALPHA_COMBINE;
		}
	}

	/**
	 * 创建云层网格（优化版本）
	 */
	private createCloudMeshes(): void {
		const worldSize = Environment.Size;
		const gridSize = 7; // 7x7网格，模仿生存战争

		for (let layerIndex = 0; layerIndex < this.cloudLayers.length; layerIndex++) {
			const layer = this.cloudLayers[layerIndex];

			// 创建云层网格
			const mesh = new Mesh(`cloudLayer_${layerIndex}`, this.scene);
			const vertexData = new VertexData();

			// 生成顶点数据
			const { positions, normals, uvs, indices } = this.generateCloudGeometry(
				layerIndex,
				worldSize,
				gridSize,
				layer
			);

			// 设置顶点数据
			vertexData.positions = positions;
			vertexData.normals = normals;
			vertexData.uvs = uvs;
			vertexData.indices = indices;

			vertexData.applyToMesh(mesh);

			// 设置材质和渲染属性
			mesh.material = this.cloudMaterials[layerIndex];
			mesh.renderingGroupId = 0; // 天空渲染组
			mesh.applyFog = false; // 云层不受雾影响

			this.cloudMeshes.push(mesh);
		}
	}

	/**
	 * 生成云层几何数据
	 */
	private generateCloudGeometry(
		layerIndex: number,
		worldSize: number,
		gridSize: number,
		layer: CloudLayerConfig
	): { positions: number[]; normals: number[]; uvs: number[]; indices: number[] } {
		const positions: number[] = [];
		const normals: number[] = [];
		const uvs: number[] = [];
		const indices: number[] = [];

		const cellSize = worldSize / (gridSize - 1);
		const halfSize = worldSize * 0.5;

		// 1. 生成顶点
		for (let row = 0; row < gridSize; row++) {
			for (let col = 0; col < gridSize; col++) {
				// 计算基础位置
				const x = (col - gridSize / 2) * cellSize;
				const z = (row - gridSize / 2) * cellSize;

				// 计算到中心的距离（归一化）
				const distanceFromCenter = Math.sqrt(x * x + z * z) / halfSize;

				// 应用云层高度曲线 - 边缘稍微降低高度
				const heightCurve = 1.0 - Math.pow(distanceFromCenter, 2) * 0.3;
				const y = layer.height * heightCurve;

				// 添加一些随机高度变化，使云层更自然
				const noise = this.generateCloudNoise(col, row, layerIndex) * 50;
				const finalY = y + noise;

				// 位置
				positions.push(x, finalY, z);

				// 法线 - 简单的向上法线，云层不需要复杂光照
				normals.push(0, 1, 0);

				// UV坐标 - 简单的平面映射
				uvs.push(col / (gridSize - 1), row / (gridSize - 1));
			}
		}

		// 2. 生成索引（三角形带）
		for (let row = 0; row < gridSize - 1; row++) {
			for (let col = 0; col < gridSize - 1; col++) {
				const topLeft = row * gridSize + col;
				const topRight = topLeft + 1;
				const bottomLeft = (row + 1) * gridSize + col;
				const bottomRight = bottomLeft + 1;

				// 第一个三角形 (topLeft -> bottomLeft -> topRight)
				indices.push(topLeft, bottomLeft, topRight);

				// 第二个三角形 (topRight -> bottomLeft -> bottomRight)
				indices.push(topRight, bottomLeft, bottomRight);
			}
		}

		return { positions, normals, uvs, indices };
	}

	/**
	 * 生成云层噪声，用于创建自然的云层形状
	 */
	private generateCloudNoise(x: number, y: number, layerIndex: number): number {
		// 简单的伪随机噪声函数
		const seed = layerIndex * 1000;
		const xf = x * 0.1 + seed;
		const yf = y * 0.1 + seed;

		// 使用正弦函数创建平滑的噪声模式
		const noise1 = Math.sin(xf + yf * 0.5) * 0.5;
		const noise2 = Math.cos(xf * 0.7 - yf * 0.3) * 0.3;
		const noise3 = Math.sin(xf * 0.3 + yf * 0.7) * 0.2;

		return (noise1 + noise2 + noise3) / 3;
	}

	/**
	 * 计算时间因子（模仿生存战争的光照强度计算）
	 */
	private calculateTimeFactor(): number {
		// 白天增加云层可见度，夜晚减少
		if (this.timeOfDay > 0.25 && this.timeOfDay < 0.75) {
			return 1.2; // 白天
		} else if (this.timeOfDay < 0.1 || this.timeOfDay > 0.9) {
			return 0.3; // 深夜
		} else {
			return 0.7; // 黎明/黄昏过渡
		}
	}

	/**
	 * 计算颜色强度（模仿生存战争的天空颜色变化）
	 */
	private calculateColorIntensity(): number {
		// 根据时间调整云层颜色亮度
		const dayProgress = this.timeOfDay;

		if (dayProgress >= 0.2 && dayProgress <= 0.8) {
			// 白天 - 最亮
			return 1.0;
		} else if (dayProgress >= 0.1 && dayProgress <= 0.9) {
			// 黎明/黄昏 - 中等亮度
			return 0.8;
		} else {
			// 夜晚 - 最暗
			return 0.4;
		}
	}
}
