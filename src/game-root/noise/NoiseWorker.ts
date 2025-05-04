import * as Comlink from "comlink";
import WorldSetting, { TerrainGenerationMode } from "@/game-root/world/WorldSetting.ts";
import MathUtils from "@/game-root/utils/MathUtils.ts";
import { SimplexNoise } from "./SimplexNoise";
import { Blocks } from "@/blocks/core/Blocks.ts";
import { ClimateData } from "@/game-root/world/Chunk.ts";
import { SeededRandom } from "./SeededRandom";
import { Grid2D, Grid3D } from "@/game-root/noise/Grid.ts";
import blockFactory from "@/blocks/core/BlockFactory.ts";

const directions = [
	[1, 0, 0], // 右
	[-1, 0, 0], // 左
	[0, 1, 0], // 上
	[0, -1, 0], // 下
	[0, 0, 1], // 前
	[0, 0, -1], // 后
];

interface V2 {
	x: number;
	y: number;
}

// 使用Comlink的类
export class NoiseWorker {
	/** 生物群系缩放因子（与地形类型和大小相关） */
	biomeScaling: number;
	/** 海岸线起伏（影响海岸的曲线程度） */
	shoreFluctuations: number;
	/** 海岸线起伏的缩放（用于进一步调整起伏比例） */
	shoreFluctuationsScaling: number;
	/** 海洋所在点 */
	oceanCorner = { x: -200, y: -200 };
	/** 海洋坡度（海洋边缘的上升斜率） */
	oceanSlope: number = 0.006;
	/** 海洋坡度变化（使海底坡度产生不规则变化） */
	oceanSlopeVariation: number = 0.004;
	/** 岛屿频率（控制岛屿分布的稀疏程度） */
	islandsFrequency: number = 0.01;
	/** 地形密度偏移，用于控制整体高度分布 */
	densityBias: number = 55;
	/** 地形高度偏移，用于整体抬高或降低地形 */
	heightBias: number = 1;
	/** 河流强度（决定河道的深度和宽度） */
	riversStrength: number = 1;
	/** 山脉强度（影响山的高度和陡峭程度） */
	mountainsStrength: number = 220;
	/** 山脉主干频率（控制大型山脉的生成频率） */
	mountainRangeFreq: number = 0.0006;
	/** 山脉占比（控制地图上山地占据的比例） */
	mountainsPercentage: number = 0.11;
	/** 山脉细节噪声频率（控制山体细节的粗糙程度） */
	mountainsDetailFreq: number = 0.003;
	/** 山脉细节使用的噪声层数（octaves） */
	mountainsDetailOctaves: number = 3;
	/** 山脉细节噪声的衰减系数 */
	mountainsDetailPersistence: number = 0.53;
	/** 丘陵占比（控制丘陵区域覆盖率） */
	hillsPercentage: number = 0.28;
	/** 丘陵强度（影响丘陵起伏程度） */
	hillsStrength: number = 32;
	/** 丘陵使用的噪声层数 */
	hillsOctaves: number = 1;
	/** 丘陵噪声频率 */
	hillsFrequency: number = 0.014;
	/** 丘陵噪声衰减值 */
	hillsPersistence: number = 0.5;
	/** 地形扰动强度（增加自然噪乱） */
	turbulenceStrength: number = 55;
	/** 扰动频率 */
	turbulenceFreq: number = 0.03;
	/** 扰动使用的噪声层数 */
	turbulenceOctaves: number = 1;
	/** 扰动噪声的衰减值 */
	turbulencePersistence: number = 0.5;
	/** 扰动最小阈值（用于限制扰动范围） */
	minTurbulence: number = 0.04;
	/** 扰动置零区域的最大值 */
	turbulenceZero: number = 0.84;
	/** 地表噪声幅度（影响表面起伏程度） */
	surfaceMultiplier: number = 2;
	/** 是否启用水体 */
	water: boolean = true;
	/** 是否启用额外装饰（例如树、草等） */
	extras: boolean = true;
	/** 是否启用洞穴与气穴生成 */
	cavesAndPockets: boolean = true;
	private _worldSetting: WorldSetting;

	private _temperatureOffset: V2;
	private _humidityOffset: V2;
	private _mountainsOffset: V2;
	private _riversOffset: V2;
	private _landSize;
	private _baseHeight = 64;
	private _minHeight = 40;
	private _maxHeight = 112;

	constructor(worldSetting: WorldSetting) {
		this._worldSetting = worldSetting;

		const random = new SeededRandom(worldSetting.seed);
		this._temperatureOffset = this.vector2(random.float(-3000, 3000), random.float(-3000, 3000));
		this._humidityOffset = this.vector2(random.float(-3000, 3000), random.float(-3000, 3000));
		this._mountainsOffset = this.vector2(random.float(-3000, 3000), random.float(-3000, 3000));
		this._riversOffset = this.vector2(random.float(-3000, 3000), random.float(-3000, 3000));

		this.biomeScaling =
			(worldSetting.terrainGenerationMode === TerrainGenerationMode.Island ? 1.0 : 1.75) *
			worldSetting.biomeSize;
		const islandSize =
			worldSetting.terrainGenerationMode === TerrainGenerationMode.Island
				? { x: worldSetting.islandSize.x, y: worldSetting.islandSize.y }
				: null;
		this._landSize = islandSize;
		const size = islandSize ? Math.min(islandSize.x, islandSize.y) : Number.MAX_VALUE;
		this.shoreFluctuations = Math.min(Math.max(2.0 * size, 0.0), 150.0);
		this.shoreFluctuationsScaling = Math.min(Math.max(0.04 * size, 0.5), 3.0);
	}

	getOceanLevel(): number {
		return 64 + this._worldSetting.seaLevelOffset;
	}

	vector2(x: number, y: number) {
		return { x: x, y: y };
	}

	public calculateTemperature(x: number, z: number): number {
		return MathUtils.clamp(
			Math.floor(
				MathUtils.saturate(
					3 *
						SimplexNoise.OctavedNoise2D(
							x + this._temperatureOffset.x,
							z + this._temperatureOffset.y,
							0.0015 / this.biomeScaling,
							5,
							2,
							0.6
						) -
						1.1 +
						this._worldSetting.temperatureOffset / 16
				) * 16
			),
			0,
			15
		);
	}

	public calculateHumidity(x: number, z: number): number {
		return MathUtils.clamp(
			Math.floor(
				MathUtils.saturate(
					3 *
						SimplexNoise.OctavedNoise2D(
							x + this._humidityOffset.x,
							z + this._humidityOffset.y,
							0.0012 / this.biomeScaling,
							5,
							2,
							0.6
						) -
						0.9 +
						this._worldSetting.humidityOffset / 16
				) * 16
			),
			0,
			15
		);
	}

	public generateTerrain(
		chunkOriginX: number,
		chunkOriginZ: number,
		chunkSize: number,
		chunkHeight: number
	): { climateData: ClimateData[][]; blockGrid: Grid3D; surfaceBlocks: Set<string> } {
		const climateData = this._initClimateData(chunkSize);
		const { temperatureGrid, humidityGrid, oceanDistanceGrid, mountainRangeGrid } =
			this._generateFeatureGrids(chunkOriginX, chunkOriginZ, chunkSize, climateData);

		const densityGrid = this._generateDensityGrid(chunkOriginX, chunkOriginZ, chunkSize);
		//console.log(climateData);
		const blockGrid = this._populateTerrain(
			densityGrid,
			oceanDistanceGrid,
			mountainRangeGrid,
			temperatureGrid,
			humidityGrid,
			chunkSize,
			chunkHeight
		);
		const surfaceBlocks = this._markSurfaceBlocksSparse(blockGrid, chunkSize, chunkHeight);

		return {
			climateData,
			blockGrid,
			surfaceBlocks,
		};
	}

	// 计算海洋和岸边的距离
	calculateOceanShoreDistance(x: number, z: number): number {
		if (this._landSize) {
			const shoreX1 = this.calculateOceanShoreX(z);
			const shoreZ1 = this.calculateOceanShoreZ(x);
			const shoreX2 = this.calculateOceanShoreX(z + 1000) + this._landSize.x;
			const shoreZ2 = this.calculateOceanShoreZ(x + 1000) + this._landSize.y;
			return Math.min(x - shoreX1, z - shoreZ1, shoreX2 - x, shoreZ2 - z);
		}

		const shoreX = this.calculateOceanShoreX(z);
		const shoreZ = this.calculateOceanShoreZ(x);
		return Math.min(x - shoreX, z - shoreZ);
	}

	calculateOceanShoreX(z: number): number {
		return (
			this.oceanCorner.x +
			this.shoreFluctuations *
				SimplexNoise.OctavedNoise2D(z, 0, 0.005 / this.shoreFluctuationsScaling, 4, 1.95, 1)
		);
	}

	calculateOceanShoreZ(x: number): number {
		return (
			this.oceanCorner.y +
			this.shoreFluctuations *
				SimplexNoise.OctavedNoise2D(0, x, 0.005 / this.shoreFluctuationsScaling, 4, 1.95, 1)
		);
	}

	// 计算山脉范围的影响因子
	calculateMountainRangeFactor(x: number, z: number): number {
		// 使用SimplexNoise计算山脉因子
		return SimplexNoise.OctavedNoise2D(
			x + this._mountainsOffset.x,
			z + this._mountainsOffset.y,
			this.mountainRangeFreq / this.biomeScaling,
			3,
			1.91,
			0.75,
			true // 设置为ridged
		);
	}

	public calculateHeight(x: number, z: number): number {
		// 海洋坡度噪声影响（决定海岸线形状）
		const oceanSlopeNoise =
			2 *
				SimplexNoise.OctavedNoise2D(
					x + this._mountainsOffset.x,
					z + this._mountainsOffset.y,
					0.01,
					1,
					2.0,
					0.5
				) -
			1;
		const oceanSlope =
			this.oceanSlope + this.oceanSlopeVariation * MathUtils.powSign(oceanSlopeNoise, 0.5);

		// 计算距离海岸线的距离
		const shoreDistance = this.calculateOceanShoreDistance(x, z);

		// 控制岛屿是否突出海面（距离越远越明显）
		const shoreFactor = MathUtils.saturate(2.0 - 0.05 * Math.abs(shoreDistance));

		// 控制岛屿的周期性分布
		const islandWave = MathUtils.saturate(Math.sin(this.islandsFrequency * shoreDistance));

		// 用于将一些靠近海岸的岛屿压低（num5 < 0 表示沉没）
		const islandSuppression = MathUtils.saturate(
			MathUtils.saturate(-oceanSlope * shoreDistance) - 0.85 * islandWave
		);

		// 用于控制离海岸太远的区域不再生成山脉或岛屿
		const farSuppression = MathUtils.saturate(
			MathUtils.saturate(0.05 * (-shoreDistance - 10.0)) - islandWave
		);

		// 山脉控制值
		const mountainFactor = this.calculateMountainRangeFactor(x, z);

		// 起伏变化控制（随机地形细节）
		const elevationNoise1 =
			(1.0 - shoreFactor) *
			SimplexNoise.OctavedNoise2D(x, z, 0.001 / this.biomeScaling, 2, 2.0, 0.5);

		const elevationNoise2 =
			(1.0 - shoreFactor) *
			SimplexNoise.OctavedNoise2D(x, z, 0.0017 / this.biomeScaling, 2, 4.0, 0.7);

		// 丘陵与山脉因子（由山脉控制值 + 是否靠海）
		const hillsFactor =
			(1.0 - farSuppression) *
			(1.0 - shoreFactor) *
			MathUtils.squish(mountainFactor, 1.0 - this.hillsPercentage, 1.0 - this.mountainsPercentage);

		const mountainsFactor =
			(1.0 - farSuppression) *
			MathUtils.squish(mountainFactor, 1.0 - this.mountainsPercentage, 1.0);

		// 丘陵噪声（决定丘陵起伏强度）
		const hillsNoise = SimplexNoise.OctavedNoise2D(
			x,
			z,
			this.hillsFrequency,
			this.hillsOctaves,
			1.93,
			this.hillsPersistence
		);

		// 山体噪声（影响山峰结构）
		const mountainsPersistence = MathUtils.lerp(
			0.75 * this.mountainsDetailPersistence,
			1.33 * this.mountainsDetailPersistence,
			elevationNoise1
		);

		const mountainsNoise =
			1.5 *
				SimplexNoise.OctavedNoise2D(
					x,
					z,
					this.mountainsDetailFreq,
					this.mountainsDetailOctaves,
					1.98,
					mountainsPersistence
				) -
			0.5;

		// 地形最大高度
		const maxHeight = MathUtils.lerp(
			80.0,
			35.0,
			MathUtils.saturate(
				mountainsFactor + 0.5 * hillsFactor + MathUtils.saturate(1.0 - shoreDistance / 30.0)
			)
		);

		// 河谷高度（如果有河流）
		const valleyHeight = MathUtils.lerp(
			-2.0,
			-4.0,
			MathUtils.saturate(mountainsFactor + 0.5 * hillsFactor)
		);

		// 河流掏蚀强度（模拟河流对地形的侵蚀）
		const riverErosion = MathUtils.saturate(
			1.5 -
				maxHeight *
					Math.abs(
						2 *
							SimplexNoise.OctavedNoise2D(
								x + this._riversOffset.x,
								z + this._riversOffset.y,
								0.001,
								4,
								2.0,
								0.5
							) -
							1
					)
		);

		// 组合地形高度分量
		const baseHeight = -50.0 * islandSuppression + this.heightBias;
		const elevationOffset1 = MathUtils.lerp(0.0, 8.0, elevationNoise1);
		const elevationOffset2 = MathUtils.lerp(0.0, -6.0, elevationNoise2);
		const hillsHeight = this.hillsStrength * hillsFactor * hillsNoise;
		const mountainsHeight = this.mountainsStrength * mountainsFactor * mountainsNoise;
		const riverCarving = this.riversStrength * riverErosion;

		// 最终地形高度
		const rawHeight =
			baseHeight + elevationOffset1 + elevationOffset2 + mountainsHeight + hillsHeight;
		const carvedHeight = MathUtils.min(
			MathUtils.lerp(rawHeight, valleyHeight, riverCarving),
			rawHeight
		);

		// 限制最终高度在 _minHeight - _maxHeight 之间，并加上基础高度（如海平面）
		return MathUtils.clamp(this._baseHeight + carvedHeight, this._minHeight, this._maxHeight);
	}

	// 初始化气候数据网格
	private _initClimateData(chunkSize: number): ClimateData[][] {
		return Array.from({ length: chunkSize }, () =>
			Array.from({ length: chunkSize }, () => ({
				temperature: 0,
				humidity: 0,
			}))
		);
	}

	// 初始化方块数组
	private _initTerrainBlocks(chunkSize: number, chunkHeight: number): Blocks[][][] {
		return Array.from({ length: chunkSize }, () =>
			Array.from({ length: chunkHeight }, () => Array.from({ length: chunkSize }, () => Blocks.Air))
		);
	}

	// 生成温度、湿度、海洋距离和山地因子等特征网格
	private _generateFeatureGrids(
		chunkOriginX: number,
		chunkOriginZ: number,
		chunkSize: number,
		climateData: ClimateData[][]
	) {
		const temperatureGrid = new Grid2D(chunkSize, chunkSize);
		const humidityGrid = new Grid2D(chunkSize, chunkSize);
		const oceanDistanceGrid = new Grid2D(chunkSize, chunkSize);
		const mountainRangeGrid = new Grid2D(chunkSize, chunkSize);

		for (let localX = 0; localX < chunkSize; localX++) {
			for (let localZ = 0; localZ < chunkSize; localZ++) {
				const worldX = localX + chunkOriginX;
				const worldZ = localZ + chunkOriginZ;

				const temperature = this.calculateTemperature(worldX, worldZ);
				const humidity = this.calculateHumidity(worldX, worldZ);

				temperatureGrid.set(localX, localZ, temperature);
				humidityGrid.set(localX, localZ, humidity);
				oceanDistanceGrid.set(localX, localZ, this.calculateOceanShoreDistance(worldX, worldZ));
				mountainRangeGrid.set(localX, localZ, this.calculateMountainRangeFactor(worldX, worldZ));

				climateData[localX][localZ] = { temperature, humidity };
			}
		}

		return { temperatureGrid, humidityGrid, oceanDistanceGrid, mountainRangeGrid };
	}

	// 生成低分辨率的密度场数据
	private _generateDensityGrid(
		chunkOriginX: number,
		chunkOriginZ: number,
		chunkSize: number
	): Grid3D {
		const densityGrid = new Grid3D(
			Math.floor(chunkSize / 4) + 1,
			33,
			Math.floor(chunkSize / 4) + 1
		);

		for (let blockX = 0; blockX < densityGrid.sizeX; blockX++) {
			for (let blockZ = 0; blockZ < densityGrid.sizeZ; blockZ++) {
				const worldX = blockX * 4 + chunkOriginX;
				const worldZ = blockZ * 4 + chunkOriginZ;

				const baseHeight = this.calculateHeight(worldX, worldZ);
				const mountainFactor = this.calculateMountainRangeFactor(worldX, worldZ);

				const turbulenceStrength = MathUtils.lerp(
					this.minTurbulence,
					1.0,
					MathUtils.squish(mountainFactor, this.turbulenceZero, 1.0)
				);

				for (let layerY = 0; layerY < densityGrid.sizeY; layerY++) {
					const altitude = layerY * 8;

					const turbulence =
						this.turbulenceStrength *
						turbulenceStrength *
						MathUtils.saturate(baseHeight - altitude) *
						(2 *
							SimplexNoise.OctavedNoise3D(
								worldX,
								altitude,
								worldZ,
								this.turbulenceFreq,
								this.turbulenceOctaves,
								4.0,
								this.turbulencePersistence
							) -
							1);

					const densityValue =
						baseHeight - (altitude + turbulence) + Math.max(4 * (this.densityBias - altitude), 0);

					densityGrid.set(blockX, layerY, blockZ, densityValue);
				}
			}
		}

		return densityGrid;
	}

	// 使用密度数据生成最终地形方块
	private _populateTerrain(
		densityGrid: Grid3D,
		oceanDistanceGrid: Grid2D,
		mountainRangeGrid: Grid2D,
		temperatureGrid: Grid2D,
		humidityGrid: Grid2D,
		chunkSize: number,
		chunkHeight: number
	) {
		const blockGrid = new Grid3D(chunkSize, chunkHeight, chunkSize);
		for (let blockX = 0; blockX < densityGrid.sizeX - 1; blockX++) {
			for (let blockZ = 0; blockZ < densityGrid.sizeZ - 1; blockZ++) {
				for (let blockY = 0; blockY < densityGrid.sizeY - 1; blockY++) {
					const [d000, d100, d010, d110, d001, d101, d011, d111] = densityGrid.get8(
						blockX,
						blockY,
						blockZ
					);

					const deltaXFront = (d100 - d000) / 4;
					const deltaXBack = (d110 - d010) / 4;
					const deltaZFront = (d001 - d000) / 4;
					const deltaZBack = (d011 - d010) / 4;

					let currentFrontLeft = d000;
					let currentBackLeft = d010;
					let currentFrontRight = d001;
					let currentBackRight = d011;

					for (let subX = 0; subX < 4; subX++) {
						const deltaZXFront = (currentFrontRight - currentFrontLeft) / 4;
						const deltaZXBack = (currentBackRight - currentBackLeft) / 4;

						let currentFront = currentFrontLeft;
						let currentBack = currentBackLeft;

						for (let subZ = 0; subZ < 4; subZ++) {
							const verticalDelta = (currentBack - currentFront) / 8;
							let currentDensity = currentFront;

							const terrainX = blockX * 4 + subX;
							const terrainZ = blockZ * 4 + subZ;

							const oceanDist = oceanDistanceGrid.get(terrainX, terrainZ);
							const mountainVal = mountainRangeGrid.get(terrainX, terrainZ);
							const temp = temperatureGrid.get(terrainX, terrainZ);
							const humid = humidityGrid.get(terrainX, terrainZ);

							const adjustedMountain = mountainVal - 0.01 * humid;
							const stoneHeight = MathUtils.lerp(100, 0, adjustedMountain);
							const dirtHeight = MathUtils.lerp(300, 30, adjustedMountain);

							const isDesert =
								(temp > 8 && humid < 8 && mountainVal < 0.97) ||
								(Math.abs(oceanDist) < 16 && mountainVal < 0.97);

							for (let subY = 0; subY < 8; subY++) {
								const terrainY = blockY * 8 + subY;
								let blockType = this._getBlockTypeAt(
									currentDensity,
									terrainY,
									isDesert,
									dirtHeight,
									stoneHeight
								);

								if (terrainX < chunkSize && terrainY < chunkHeight && terrainZ < chunkSize) {
									blockGrid.set(terrainX, terrainY, terrainZ, blockType);
								}

								currentDensity += verticalDelta;
							}

							currentFront += deltaZXFront;
							currentBack += deltaZXBack;
						}

						currentFrontLeft += deltaXFront;
						currentBackLeft += deltaXBack;
						currentFrontRight += deltaZFront;
						currentBackRight += deltaZBack;
					}
				}
			}
		}
		return blockGrid;
	}

	private _getBlockTypeAt(
		currentDensity: number,
		terrainY: number,
		isDesert: boolean,
		dirtHeight: number,
		stoneHeight: number
	): Blocks {
		if (currentDensity < 0) {
			return terrainY <= this.getOceanLevel() ? Blocks.Water : Blocks.Air;
		}

		if (isDesert) {
			if (currentDensity < stoneHeight) {
				return Blocks.Dirt;
			} else if (currentDensity < dirtHeight) {
				return Blocks.Sand;
			} else {
				return Blocks.Stone;
			}
		} else {
			return currentDensity < dirtHeight ? Blocks.Sand : Blocks.Stone;
		}
	}

	private _markSurfaceBlocksSparse(
		blockGrid: Grid3D,
		chunkSize: number,
		chunkHeight: number
	): Set<string> {
		const surfaceSet = new Set<string>();

		for (let x = 0; x < chunkSize; x++) {
			for (let y = this._minHeight; y <= this._maxHeight; y++) {
				for (let z = 0; z < chunkSize; z++) {
					const block = blockGrid.get(x, y, z);
					const blockClass = blockFactory.getBlockClass(block);
					// 如果本身是透明方块或者挨着透明方块而且不是空气
					if (
						block &&
						(blockClass?.__isTransparent ||
							this._hasTransparentNeighbor(x, y, z, blockGrid, chunkSize, chunkHeight))
					) {
						surfaceSet.add(`${x},${y},${z}`);
					}
				}
			}
		}

		return surfaceSet;
	}

	private _hasTransparentNeighbor(
		x: number,
		y: number,
		z: number,
		blockGrid: Grid3D,
		chunkSize: number,
		chunkHeight: number
	): boolean {
		for (const [dx, dy, dz] of directions) {
			const nx = x + dx;
			const ny = y + dy;
			const nz = z + dz;

			// 超出边界的方块视为不透明
			if (nx < 0 || ny < 0 || nz < 0 || nx >= chunkSize || ny >= chunkHeight || nz >= chunkSize) {
				continue; // TODO:这里暂时跳过，但是会有面不渲染，如果返回true会严重增加计算量
			}

			const neighbor = blockGrid.get(nx, ny, nz);
			const blockClass = blockFactory.getBlockClass(neighbor);

			// 如果没有注册(空气) 或者是透明方块(水)
			if (!blockClass || blockClass.__isTransparent) {
				return true; // 发现透明邻居，返回 true
			}
		}

		return false; // 没有透明邻居，返回 false
	}

	private _create3DBooleanArray(xSize: number, ySize: number, zSize: number): boolean[][][] {
		const array: boolean[][][] = new Array(xSize);
		for (let x = 0; x < xSize; x++) {
			array[x] = new Array(ySize);
			for (let y = 0; y < ySize; y++) {
				array[x][y] = new Array(zSize).fill(false);
			}
		}
		return array;
	}
}

// 使用Comlink将类暴露给主线程
Comlink.expose(NoiseWorker);
