import { GameTime } from "../systems/GameTime";
import { SingleClass } from "../core/Singleton";

/**
 * 天气类型枚举
 */
export enum WeatherType {
	CLEAR = "clear",
	CLOUDY = "cloudy",
	RAINY = "rainy",
	STORMY = "stormy",
	SNOWY = "snowy",
}

/**
 * 天气强度枚举
 */
export enum WeatherIntensity {
	LIGHT = 0.25,
	MODERATE = 0.5,
	HEAVY = 0.75,
	SEVERE = 1.0,
}

/**
 * 天气系统 - 模仿生存战争的天气机制
 */
export class WeatherSystem extends SingleClass {
	private gameTime: GameTime;

	// 天气状态
	private currentWeather: WeatherType = WeatherType.CLEAR;
	private weatherIntensity: WeatherIntensity = WeatherIntensity.LIGHT;

	// 天气变化参数
	private weatherChangeTimer: number = 0;
	private weatherDuration: number = 0; // 当前天气持续时间（分钟）

	// 雾气参数（模仿生存战争的雾气系统）
	private fogSeed: number = 0;
	private fogIntensity: number = 0;

	// 降雨参数
	private precipitationIntensity: number = 0; // 降雨强度 0-1
	private precipitationType: WeatherType = WeatherType.CLEAR;

	constructor() {
		super();
		this.gameTime = GameTime.Instance;
		this.initializeWeather();
	}

	public static get Instance(): WeatherSystem {
		return this.getInstance();
	}

	public override dispose(): void {}

	/**
	 * 更新天气系统
	 */
	public update(deltaTime: number): void {
		// 更新天气变化计时器
		this.weatherChangeTimer -= deltaTime;

		// 检查是否需要改变天气
		if (this.weatherChangeTimer <= 0) {
			this.generateRandomWeather();
		}

		// 更新雾气效果（模仿生存战争的雾气变化）
		this.updateFogEffect();

		// 根据天气更新降雨强度（平滑过渡）
		this.updatePrecipitation();
	}

	/**
	 * 获取当前天气类型
	 */
	public getCurrentWeather(): WeatherType {
		return this.currentWeather;
	}

	/**
	 * 获取天气强度
	 */
	public getWeatherIntensity(): WeatherIntensity {
		return this.weatherIntensity;
	}

	/**
	 * 获取雾气强度
	 */
	public getFogIntensity(): number {
		return this.fogIntensity;
	}

	/**
	 * 获取雾气种子（用于生存战争风格的雾气计算）
	 */
	public getFogSeed(): number {
		return this.fogSeed;
	}

	/**
	 * 获取降雨强度
	 */
	public getPrecipitationIntensity(): number {
		return this.precipitationIntensity;
	}

	/**
	 * 获取降雨类型
	 */
	public getPrecipitationType(): WeatherType {
		return this.precipitationType;
	}

	/**
	 * 设置天气（用于调试或特定事件）
	 */
	public setWeather(weather: WeatherType, intensity: WeatherIntensity): void {
		this.currentWeather = weather;
		this.weatherIntensity = intensity;

		// 更新相关参数
		switch (weather) {
			case WeatherType.CLEAR:
			case WeatherType.CLOUDY:
				this.precipitationIntensity = 0;
				break;
			default:
				this.precipitationIntensity = intensity;
				break;
		}

		this.precipitationType = weather;

		console.log(`[WeatherSystem] 天气已设置为: ${weather}, 强度: ${intensity}`);
	}

	/**
	 * 获取天气描述
	 */
	public getWeatherDescription(): string {
		const intensityStr =
			this.weatherIntensity === WeatherIntensity.LIGHT
				? "轻微"
				: this.weatherIntensity === WeatherIntensity.MODERATE
					? "中等"
					: this.weatherIntensity === WeatherIntensity.HEAVY
						? "强烈"
						: "剧烈";

		return `${intensityStr}${this.currentWeather}`;
	}

	/**
	 * 初始化天气系统
	 */
	private initializeWeather(): void {
		// 随机种子用于雾气生成（模仿生存战争）
		this.fogSeed = Math.floor(Math.random() * 10000);

		// 设置初始天气
		this.generateRandomWeather();

		console.log("[WeatherSystem] 天气系统初始化完成");
	}

	private getRandomInt(a: number, b: number): number {
		const min = Math.min(a, b);
		const max = Math.max(a, b);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	/**
	 * 生成随机天气
	 */
	private generateRandomWeather(): void {
		const random = Math.random();

		// 根据随机值决定天气类型（模仿生存战争的天气概率）
		if (random < 0.4) {
			this.currentWeather = WeatherType.CLEAR;
			this.weatherIntensity = WeatherIntensity.LIGHT;
			this.weatherDuration = this.getRandomInt(60, 180); // 晴天持续1-3小时
		} else if (random < 0.7) {
			this.currentWeather = WeatherType.CLOUDY;
			this.weatherIntensity = WeatherIntensity.MODERATE;
			this.weatherDuration = this.getRandomInt(30, 90); // 多云持续0.5-1.5小时
		} else if (random < 0.85) {
			this.currentWeather = WeatherType.RAINY;
			this.weatherIntensity = WeatherIntensity.MODERATE;
			this.weatherDuration = this.getRandomInt(20, 60); // 雨天持续20-60分钟
		} else if (random < 0.95) {
			this.currentWeather = WeatherType.STORMY;
			this.weatherIntensity = WeatherIntensity.HEAVY;
			this.weatherDuration = this.getRandomInt(10, 30); // 暴风雨持续10-30分钟
		} else {
			this.currentWeather = WeatherType.SNOWY;
			this.weatherIntensity = WeatherIntensity.MODERATE;
			this.weatherDuration = this.getRandomInt(15, 45); // 雪天持续15-45分钟
		}

		// 根据天气类型设置降雨强度
		switch (this.currentWeather) {
			case WeatherType.CLEAR:
			case WeatherType.CLOUDY:
				this.precipitationIntensity = 0;
				break;
			case WeatherType.RAINY:
				this.precipitationIntensity = this.weatherIntensity;
				break;
			case WeatherType.STORMY:
				this.precipitationIntensity = this.weatherIntensity * 1.2; // 暴风雨降雨更强
				break;
			case WeatherType.SNOWY:
				this.precipitationIntensity = this.weatherIntensity * 0.8; // 雪的降水强度稍低
				break;
		}

		this.precipitationType = this.currentWeather;
		this.weatherChangeTimer = this.weatherDuration * 60; // 转换为秒
	}

	/**
	 * 更新雾气效果（模仿生存战争的雾气计算）
	 */
	private updateFogEffect(): void {
		// 雾气种子随机（模仿生存战争）
		const fogRandom = this.createSeededRandom(this.fogSeed);

		// 计算雾气基础值（模仿生存战争的雾气计算）
		let baseFog = fogRandom.nextFloat();

		// 根据天气类型调整雾气强度
		switch (this.currentWeather) {
			case WeatherType.CLEAR:
				baseFog *= 0.3; // 晴天雾气少
				break;
			case WeatherType.CLOUDY:
				baseFog *= 0.5; // 多云中等雾气
				break;
			case WeatherType.RAINY:
			case WeatherType.STORMY:
				baseFog *= 0.8; // 雨天雾气多
				break;
			case WeatherType.SNOWY:
				baseFog *= 0.6; // 雪天中等雾气
				break;
		}

		// 雾气强度基于天气强度
		this.fogIntensity = baseFog * this.weatherIntensity;
	}

	/**
	 * 更新降雨强度（平滑过渡）
	 */
	private updatePrecipitation(): void {
		// 目标降雨强度
		let targetIntensity = this.precipitationIntensity;

		// 平滑过渡到目标强度
		const lerpFactor = 0.02; // 平滑因子
		this.precipitationIntensity = this.lerp(
			this.precipitationIntensity,
			targetIntensity,
			lerpFactor
		);
	}

	/**
	 * 创建带种子的随机数生成器（模仿生存战争）
	 */
	private createSeededRandom(seed: number) {
		let m = 2 ** 32;
		let a = 1664525;
		let c = 1013904223;

		return {
			nextFloat: () => {
				seed = (a * seed + c) % m;
				return seed / m;
			},
		};
	}

	/**
	 * 线性插值
	 */
	private lerp(start: number, end: number, factor: number): number {
		return start + (end - start) * factor;
	}
}
