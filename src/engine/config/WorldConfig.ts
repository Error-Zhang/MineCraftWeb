/**
 * 世界配置管理
 * 提供统一的配置接口，避免直接修改静态属性
 */
export class WorldConfig {
	private static _chunkSize: number = 16;

	/**
	 * 获取区块大小
	 */
	public static get chunkSize(): number {
		return this._chunkSize;
	}

	private static _chunkHeight: number = 256;

	/**
	 * 获取区块高度
	 */
	public static get chunkHeight(): number {
		return this._chunkHeight;
	}

	private static _viewDistance: number = 8;

	/**
	 * 获取视距
	 */
	public static get viewDistance(): number {
		return this._viewDistance;
	}

	/**
	 * 初始化世界配置
	 * 只能在创建世界前调用一次
	 */
	public static initialize(config: {
		chunkSize?: number;
		chunkHeight?: number;
		viewDistance?: number;
	}): void {
		// 验证并设置区块大小
		if (config.chunkSize) {
			if (!this.validateChunkSize(config.chunkSize)) {
				throw new Error(
					`[WorldConfig] 无效的区块大小: ${config.chunkSize}，必须是2的幂次方且在8-64之间`
				);
			}
			this._chunkSize = config.chunkSize;
		}

		// 验证并设置区块高度
		if (config.chunkHeight) {
			if (!this.validateChunkHeight(config.chunkHeight)) {
				throw new Error(
					`[WorldConfig] 无效的区块高度: ${config.chunkHeight}，必须是2的幂次方且在64-512之间`
				);
			}
			this._chunkHeight = config.chunkHeight;
		}

		// 验证并设置视距
		if (config.viewDistance) {
			if (!this.validateViewDistance(config.viewDistance)) {
				throw new Error(`[WorldConfig] 无效的视距: ${config.viewDistance}，必须在1-16之间`);
			}
			this._viewDistance = config.viewDistance;
		}

		console.log("[WorldConfig] 配置初始化完成:", {
			chunkSize: this._chunkSize,
			chunkHeight: this._chunkHeight,
			viewDistance: this._viewDistance,
		});
	}

	/**
	 * 重置配置（用于测试或重新初始化）
	 */
	public static reset(): void {
		this._chunkSize = 16;
		this._chunkHeight = 256;
		this._viewDistance = 8;
		console.log("[WorldConfig] 配置已重置");
	}

	/**
	 * 运行时修改视距（仅限视距，其他参数不可运行时修改）
	 */
	public static setViewDistance(distance: number): void {
		if (!this.validateViewDistance(distance)) {
			console.error(`[WorldConfig] 无效的视距: ${distance}，必须在1-16之间`);
			return;
		}

		const oldDistance = this._viewDistance;
		this._viewDistance = distance;

		console.log(`[WorldConfig] 视距已更新: ${oldDistance} -> ${distance}`);
	}

	/**
	 * 获取配置信息
	 */
	public static getConfig(): {
		chunkSize: number;
		chunkHeight: number;
		viewDistance: number;
	} {
		return {
			chunkSize: this._chunkSize,
			chunkHeight: this._chunkHeight,
			viewDistance: this._viewDistance,
		};
	}

	// ==================== 验证方法 ====================

	/**
	 * 验证区块大小
	 * 必须是2的幂次方且在合理范围内
	 */
	private static validateChunkSize(size: number): boolean {
		return (
			Number.isInteger(size) && size >= 8 && size <= 64 && (size & (size - 1)) === 0 // 检查是否是2的幂次方
		);
	}

	/**
	 * 验证区块高度
	 * 必须是2的幂次方且在合理范围内
	 */
	private static validateChunkHeight(height: number): boolean {
		return (
			Number.isInteger(height) && height >= 64 && height <= 512 && (height & (height - 1)) === 0 // 检查是否是2的幂次方
		);
	}

	/**
	 * 验证视距
	 * 必须在合理范围内
	 */
	private static validateViewDistance(distance: number): boolean {
		return Number.isInteger(distance) && distance >= 1 && distance <= 16;
	}
}
