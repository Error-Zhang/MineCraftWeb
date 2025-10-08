import { Vector3 } from "@babylonjs/core";
import { WorldController } from "@engine/core/WorldController";
import { ChunkManager } from "@engine/chunk/ChunkManager";
import { BiomeInfo, BiomeType } from "./types";

/**
 * 生物群系分析器
 * 基于生存战争的环境分析系统，用于计算动物生成适宜度
 */
export class BiomeAnalyzer {
	private temperatureCache = new Map<string, number>();
	private humidityCache = new Map<string, number>();
	private elevationCache = new Map<string, number>(); // 海拔

	constructor(private worldController: WorldController) {}

	/**
	 * 分析指定位置的生物群系信息
	 */
	public analyzeBiome(position: Vector3): BiomeInfo {
		const x = Math.floor(position.x);
		const y = Math.floor(position.y);
		const z = Math.floor(position.z);

		const temperature = this.getTemperature(x, z);
		const humidity = this.getHumidity(x, z);
		const elevation = this.getElevation(x, z);
		const distanceToWater = this.calculateDistanceToWater(x, z);
		const forestDensity = this.calculateForestDensity(x, z);
		const grassDensity = this.calculateGrassDensity(x, z);
		const rockDensity = this.calculateRockDensity(x, z);
		const lightLevel = this.getLightLevel(x, y, z);
		const isUnderground = y < this.worldController.chunkManager.getColumnHeight(x, z) - 5;
		const isNearWater = distanceToWater < 10;
		const biomeType = this.determineBiomeType(temperature, humidity, elevation, distanceToWater);

		return {
			temperature,
			humidity,
			elevation,
			distanceToWater,
			forestDensity,
			grassDensity,
			rockDensity,
			lightLevel,
			isUnderground,
			isNearWater,
			biomeType,
		};
	}

	/**
	 * 计算海岸距离（类似生存战争的CalculateOceanShoreDistance）
	 */
	public calculateOceanShoreDistance(x: number, z: number): number {
		// 这是一个简化版本，实际实现应该更复杂
		const distanceToWater = this.calculateDistanceToWater(x, z);
		const elevation = this.getElevation(x, z);

		// 如果海拔低于海平面，认为是海洋
		if (elevation < 64) {
			return -distanceToWater; // 负值表示在海洋中
		}

		return distanceToWater;
	}

	/**
	 * 清理缓存
	 */
	public clearCache() {
		this.temperatureCache.clear();
		this.humidityCache.clear();
		this.elevationCache.clear();
	}

	/**
	 * 获取生物群系适宜度评分
	 */
	public getBiomeSuitability(
		position: Vector3,
		preferredBiomes: BiomeType[],
		avoidedBiomes: BiomeType[]
	): number {
		const biome = this.analyzeBiome(position);

		// 如果在避免的生物群系中，返回0
		if (avoidedBiomes.includes(biome.biomeType)) {
			return 0;
		}

		// 如果在偏好的生物群系中，返回高分
		if (preferredBiomes.includes(biome.biomeType)) {
			return 1.0;
		}

		// 否则返回中等分数
		return 0.3;
	}

	/**
	 * 获取温度值 (0-15)
	 */
	private getTemperature(x: number, z: number): number {
		const key = `${x},${z}`;
		if (this.temperatureCache.has(key)) {
			return this.temperatureCache.get(key)!;
		}

		// 基于纬度的温度计算
		const latitude = Math.abs(z / 1000) % 1; // 简化的纬度计算
		const baseTemp = 15 - latitude * 12; // 赤道15度，极地3度

		// 基于海拔的温度修正
		const elevation = this.getElevation(x, z);
		const altitudeModifier = Math.max(0, (elevation - 64) / 10); // 海拔每10格降低1度

		// 添加一些随机变化
		const noise = this.generateNoise(x * 0.01, z * 0.01) * 2;

		const temperature = Math.max(0, Math.min(15, baseTemp - altitudeModifier + noise));
		this.temperatureCache.set(key, temperature);
		return temperature;
	}

	/**
	 * 获取湿度值 (0-15)
	 */
	private getHumidity(x: number, z: number): number {
		const key = `${x},${z}`;
		if (this.humidityCache.has(key)) {
			return this.humidityCache.get(key)!;
		}

		// 基于距离水源的湿度计算
		const distanceToWater = this.calculateDistanceToWater(x, z);
		const waterHumidity = Math.max(0, 15 - distanceToWater / 10);

		// 基于温度的湿度修正
		const temperature = this.getTemperature(x, z);
		const tempModifier = temperature > 12 ? -3 : temperature < 5 ? -2 : 0;

		// 添加噪声
		const noise = this.generateNoise(x * 0.005, z * 0.005) * 3;

		const humidity = Math.max(0, Math.min(15, waterHumidity + tempModifier + noise));
		this.humidityCache.set(key, humidity);
		return humidity;
	}

	/**
	 * 获取海拔高度
	 */
	private getElevation(x: number, z: number): number {
		const key = `${x},${z}`;
		if (this.elevationCache.has(key)) {
			return this.elevationCache.get(key)!;
		}

		const elevation = this.worldController.chunkManager.getColumnHeight(x, z);
		this.elevationCache.set(key, elevation);
		return elevation;
	}

	/**
	 * 计算到水源的距离
	 */
	private calculateDistanceToWater(x: number, z: number): number {
		let minDistance = Infinity;
		const searchRadius = 50;

		// 搜索周围的水源
		for (let dx = -searchRadius; dx <= searchRadius; dx += 5) {
			for (let dz = -searchRadius; dz <= searchRadius; dz += 5) {
				const checkX = x + dx;
				const checkZ = z + dz;
				const y = this.worldController.chunkManager.getColumnHeight(checkX, checkZ);

				// 检查是否是水方块 (假设水方块ID为8)
				if (this.isWaterBlock(checkX, y, checkZ) || this.isWaterBlock(checkX, y - 1, checkZ)) {
					const distance = Math.sqrt(dx * dx + dz * dz);
					minDistance = Math.min(minDistance, distance);
				}
			}
		}

		return minDistance === Infinity ? 200 : minDistance;
	}

	/**
	 * 计算森林密度 (0-1)
	 */
	private calculateForestDensity(x: number, z: number): number {
		let treeCount = 0;
		const searchRadius = 10;
		const totalChecks = (searchRadius * 2 + 1) * (searchRadius * 2 + 1);

		for (let dx = -searchRadius; dx <= searchRadius; dx += 2) {
			for (let dz = -searchRadius; dz <= searchRadius; dz += 2) {
				const checkX = x + dx;
				const checkZ = z + dz;

				if (this.hasTreeAt(checkX, checkZ)) {
					treeCount++;
				}
			}
		}

		return Math.min(1, treeCount / (totalChecks * 0.3)); // 30%覆盖率为满密度
	}

	/**
	 * 计算草地密度 (0-1)
	 */
	private calculateGrassDensity(x: number, z: number): number {
		let grassCount = 0;
		const searchRadius = 8;
		const totalChecks = (searchRadius * 2 + 1) * (searchRadius * 2 + 1);

		for (let dx = -searchRadius; dx <= searchRadius; dx += 2) {
			for (let dz = -searchRadius; dz <= searchRadius; dz += 2) {
				const checkX = x + dx;
				const checkZ = z + dz;
				const y = this.worldController.chunkManager.getColumnHeight(checkX, checkZ);

				// 检查是否是草方块 (假设草方块ID为2)
				if (this.isGrassBlock(checkX, y - 1, checkZ)) {
					grassCount++;
				}
			}
		}

		return Math.min(1, grassCount / (totalChecks * 0.6)); // 60%覆盖率为满密度
	}

	/**
	 * 计算岩石密度 (0-1)
	 */
	private calculateRockDensity(x: number, z: number): number {
		let rockCount = 0;
		const searchRadius = 8;
		const totalChecks = (searchRadius * 2 + 1) * (searchRadius * 2 + 1);

		for (let dx = -searchRadius; dx <= searchRadius; dx += 2) {
			for (let dz = -searchRadius; dz <= searchRadius; dz += 2) {
				const checkX = x + dx;
				const checkZ = z + dz;
				const y = this.worldController.chunkManager.getColumnHeight(checkX, checkZ);

				// 检查是否是石头方块 (假设石头方块ID为1)
				if (this.isStoneBlock(checkX, y - 1, checkZ)) {
					rockCount++;
				}
			}
		}

		return Math.min(1, rockCount / (totalChecks * 0.4)); // 40%覆盖率为满密度
	}

	/**
	 * 获取光照等级
	 */
	private getLightLevel(x: number, y: number, z: number): number {
		// 简化的光照计算，实际应该从世界控制器获取
		const surfaceY = this.worldController.chunkManager.getColumnHeight(x, z);
		if (y >= surfaceY) {
			return 15; // 地表满光照
		} else if (y >= surfaceY - 5) {
			return Math.max(0, 15 - (surfaceY - y) * 2); // 地下光照递减
		} else {
			return 0; // 深地下无光照
		}
	}

	/**
	 * 确定生物群系类型
	 */
	private determineBiomeType(
		temperature: number,
		humidity: number,
		elevation: number,
		distanceToWater: number
	): BiomeType {
		// 海洋和河流
		if (distanceToWater < 5) {
			return elevation < 65 ? BiomeType.Ocean : BiomeType.River;
		}

		// 沙漠 - 高温低湿
		if (temperature > 12 && humidity < 4) {
			return BiomeType.Desert;
		}

		// 苔原 - 低温
		if (temperature < 4) {
			return BiomeType.Tundra;
		}

		// 山地 - 高海拔
		if (elevation > 100) {
			return BiomeType.Mountains;
		}

		// 沼泽 - 高湿度且靠近水源
		if (humidity > 12 && distanceToWater < 20) {
			return BiomeType.Swamp;
		}

		// 森林 - 中等温湿度
		if (temperature > 6 && humidity > 6) {
			return BiomeType.Forest;
		}

		// 海滩 - 靠近水源的平地
		if (distanceToWater < 15 && elevation < 70) {
			return BiomeType.Beach;
		}

		// 默认为平原
		return BiomeType.Plains;
	}

	/**
	 * 检查指定位置是否有树
	 */
	private hasTreeAt(x: number, z: number): boolean {
		const y = this.worldController.chunkManager.getColumnHeight(x, z);

		// 检查是否有木头方块 (假设木头方块ID为17)
		for (let checkY = y; checkY < y + 10; checkY++) {
			if (this.isWoodBlock(x, checkY, z)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * 检查是否是水方块
	 */
	private isWaterBlock(x: number, y: number, z: number): boolean {
		try {
			const blockId = ChunkManager.getBlockAt(x, y, z);
			return blockId === 8 || blockId === 9; // 水和流动的水
		} catch {
			return false;
		}
	}

	/**
	 * 检查是否是草方块
	 */
	private isGrassBlock(x: number, y: number, z: number): boolean {
		try {
			const blockId = ChunkManager.getBlockAt(x, y, z);
			return blockId === 2; // 草方块
		} catch {
			return false;
		}
	}

	/**
	 * 检查是否是石头方块
	 */
	private isStoneBlock(x: number, y: number, z: number): boolean {
		try {
			const blockId = ChunkManager.getBlockAt(x, y, z);
			return blockId === 1 || blockId === 4; // 石头和圆石
		} catch {
			return false;
		}
	}

	/**
	 * 检查是否是木头方块
	 */
	private isWoodBlock(x: number, y: number, z: number): boolean {
		try {
			const blockId = ChunkManager.getBlockAt(x, y, z);
			return blockId === 17; // 木头方块
		} catch {
			return false;
		}
	}

	/**
	 * 生成简单的噪声值
	 */
	private generateNoise(x: number, z: number): number {
		// 简化的Perlin噪声实现
		const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
		return (n - Math.floor(n)) * 2 - 1; // 返回-1到1之间的值
	}
}
