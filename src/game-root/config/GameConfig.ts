/**
 * 游戏配置
 * 集中管理所有游戏特性的开关
 */
export class GameConfig {
	/**
	 * 动物系统配置
	 */
	public static readonly ANIMAL_SYSTEM = {
		// 是否启用动物系统
		enabled: false,

		// 是否启用动物AI（如果禁用，动物将只显示不移动）
		enableAI: true,

		// 是否启用网络同步
		enableNetworkSync: true,

		// 调试模式（显示更多日志）
		debugMode: false,

		// 性能配置
		performance: {
			// 最大同时更新的动物数量
			maxUpdatePerFrame: 50,

			// 区块加载半径
			chunkLoadRadius: 3,

			// 区块卸载半径
			chunkUnloadRadius: 5,

			// 位置同步间隔（毫秒）
			syncInterval: 200,
		},
	};

	/**
	 * 调试配置
	 */
	public static readonly DEBUG = {
		// 显示FPS
		showFPS: true,

		// 显示玩家坐标
		showPosition: true,

		// 显示区块边界
		showChunkBorders: false,

		// 显示动物路径
		showAnimalPaths: false,
	};

	/**
	 * 渲染配置
	 */
	public static readonly RENDER = {
		// 渲染距离（区块）
		renderDistance: 8,

		// 是否启用阴影
		enableShadows: true,

		// 是否启用抗锯齿
		enableAntialiasing: true,
	};

	/**
	 * 获取动物系统是否启用
	 */
	public static isAnimalSystemEnabled(): boolean {
		return this.ANIMAL_SYSTEM.enabled;
	}

	/**
	 * 启用/禁用动物系统
	 */
	public static setAnimalSystemEnabled(enabled: boolean): void {
		this.ANIMAL_SYSTEM.enabled = enabled;
		console.log(`[GameConfig] Animal system ${enabled ? "enabled" : "disabled"}`);
	}

	/**
	 * 启用/禁用动物AI
	 */
	public static setAnimalAIEnabled(enabled: boolean): void {
		this.ANIMAL_SYSTEM.enableAI = enabled;
		console.log(`[GameConfig] Animal AI ${enabled ? "enabled" : "disabled"}`);
	}

	/**
	 * 设置调试模式
	 */
	public static setDebugMode(enabled: boolean): void {
		this.ANIMAL_SYSTEM.debugMode = enabled;
		console.log(`[GameConfig] Debug mode ${enabled ? "enabled" : "disabled"}`);
	}
}

// 导出便捷访问
export const AnimalConfig = GameConfig.ANIMAL_SYSTEM;
export const DebugConfig = GameConfig.DEBUG;
export const RenderConfig = GameConfig.RENDER;
