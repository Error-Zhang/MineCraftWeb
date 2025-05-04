export enum GameMode {
	Creative = "Creative",
	Survival = "Survival",
	Challenging = "Challenging",
}

export enum EnvironmentBehaviorMode {
	Living = "Living",
}

export enum TimeOfDayMode {
	Changing = "Changing",
}

export enum StartingPositionMode {
	Easy = "Easy",
}

export enum TerrainGenerationMode {
	Island = "Island", // 岛屿
	FlatIsland = "FlatIsland",
	Continent = "Continent", // 大陆
	FlatContinent = "FlatContinent", // 超平坦
}

export class WorldPalette {
	constructor(data?: any) {
		// Initialize palette from valuesDictionary
	}

	save() {
		return {};
	}
}

class WorldSetting {
	/** 世界名称 */
	name: string = "";

	/** 原始序列化版本号，用于兼容旧存档 */
	originalSerializationVersion: string = "";

	/** 世界种子字符串（地图随机种子） */
	seed: number = 1234;

	/** 游戏模式（如：生存、生存加强等） */
	gameMode: GameMode = GameMode.Survival;

	/** 环境行为模式（是否有生物、物理等） */
	environmentBehaviorMode: EnvironmentBehaviorMode = EnvironmentBehaviorMode.Living;

	/** 昼夜变化模式 */
	timeOfDayMode: TimeOfDayMode = TimeOfDayMode.Changing;

	/** 是否启用四季变化 */
	areSeasonsChanging: boolean = true;

	/** 一年中的天数（影响季节长度） */
	yearDays: number = 24;

	/** 当前时间（处于哪一个季节，范围 0~1） */
	timeOfYear: number = 0.5;

	/** 起始位置模式（是否容易生存） */
	startingPositionMode: StartingPositionMode = StartingPositionMode.Easy;

	/** 是否启用天气效果（雨雪等） */
	areWeatherEffectsEnabled: boolean = true;

	/** 冒险模式下是否允许重生 */
	isAdventureRespawnAllowed: boolean = true;

	/** 是否启用冒险模式的生存机制（如饥饿、口渴） */
	areAdventureSurvivalMechanicsEnabled: boolean = true;

	/** 是否启用超自然生物（如幽灵、怪物） */
	areSupernaturalCreaturesEnabled: boolean = true;

	/** 是否允许队友之间造成伤害 */
	isFriendlyFireEnabled: boolean = true;

	/** 地形生成模式（大陆/岛屿/扁平等） */
	terrainGenerationMode: TerrainGenerationMode = TerrainGenerationMode.Continent;

	/** 岛屿大小，仅在岛屿模式下使用 */
	islandSize = { x: 400, y: 400 };

	/** 生物群系大小（值越大越宽广） */
	biomeSize: number = 1.0;

	/** 地形基础高度 */
	terrainLevel: number = 64;

	/** 海岸线粗糙度（越大越曲折） */
	shoreRoughness: number = 0.5;

	/** 地形使用的方块材质索引（主方块） */
	terrainBlockIndex: number = 8;

	/** 海洋使用的方块材质索引 */
	terrainOceanBlockIndex: number = 18;

	/** 温度偏移量（全局调整） */
	temperatureOffset: number = 0.0;

	/** 湿度偏移量（全局调整） */
	humidityOffset: number = 0.0;

	/** 海平面高度偏移 */
	seaLevelOffset: number = 0;

	/** 使用的方块纹理名称（材质包名称） */
	blocksTextureName: string = "";

	/** 世界配色方案（如草、树、光照） */
	palette: WorldPalette = new WorldPalette();

	constructor(values?: any) {
		this.init(values ?? {});
	}

	init(values: any) {
		this.name = values.WorldName || "";
		this.originalSerializationVersion = values.OriginalSerializationVersion || "";
		this.seed = values.WorldSeed || 4566788;
		this.gameMode = values.GameMode || GameMode.Creative;
		this.environmentBehaviorMode = values.EnvironmentBehaviorMode || EnvironmentBehaviorMode.Living;
		this.timeOfDayMode = values.TimeOfDayMode || TimeOfDayMode.Changing;
		this.areSeasonsChanging = values.AreSeasonsChanging ?? true;
		this.yearDays = values.YearDays ?? 24;
		this.timeOfYear = values.TimeOfYear ?? 0.5;
		this.startingPositionMode = values.StartingPositionMode || StartingPositionMode.Easy;
		this.areWeatherEffectsEnabled = values.AreWeatherEffectsEnabled ?? true;
		this.isAdventureRespawnAllowed = values.IsAdventureRespawnAllowed ?? true;
		this.areAdventureSurvivalMechanicsEnabled = values.AreAdventureSurvivalMechanicsEnabled ?? true;
		this.areSupernaturalCreaturesEnabled = values.AreSupernaturalCreaturesEnabled ?? true;
		this.isFriendlyFireEnabled = values.IsFriendlyFireEnabled ?? true;
		this.terrainGenerationMode = values.TerrainGenerationMode || TerrainGenerationMode.Continent;
		this.islandSize = values.IslandSize || { x: 200, y: 200 };
		this.terrainLevel = values.TerrainLevel ?? 64;
		this.shoreRoughness = values.ShoreRoughness ?? 0.0;
		this.terrainBlockIndex = values.TerrainBlockIndex ?? 8;
		this.terrainOceanBlockIndex = values.TerrainOceanBlockIndex ?? 18;
		this.temperatureOffset = values.TemperatureOffset ?? 0;
		this.humidityOffset = values.HumidityOffset ?? 0;
		this.seaLevelOffset = values.SeaLevelOffset ?? 0;
		this.biomeSize = values.BiomeSize ?? 1;
		this.blocksTextureName = values.BlockTextureName || "";
		this.palette = new WorldPalette(values.Palette);
	}

	save(liveOnly: boolean = false): any {
		const result: any = {
			WorldName: this.name,
			OriginalSerializationVersion: this.originalSerializationVersion,
			GameMode: this.gameMode,
			EnvironmentBehaviorMode: this.environmentBehaviorMode,
			TimeOfDayMode: this.timeOfDayMode,
			AreSeasonsChanging: this.areSeasonsChanging,
			YearDays: this.yearDays,
			TimeOfYear: this.timeOfYear,
			AreWeatherEffectsEnabled: this.areWeatherEffectsEnabled,
			IsAdventureRespawnAllowed: this.isAdventureRespawnAllowed,
			AreAdventureSurvivalMechanicsEnabled: this.areAdventureSurvivalMechanicsEnabled,
			AreSupernaturalCreaturesEnabled: this.areSupernaturalCreaturesEnabled,
			IsFriendlyFireEnabled: this.isFriendlyFireEnabled,
			BlockTextureName: this.blocksTextureName,
			Palette: this.palette.save(),
		};

		if (!liveOnly) {
			result.WorldSeed = this.seed;
			result.TerrainGenerationMode = this.terrainGenerationMode;
			result.IslandSize = this.islandSize;
			result.TerrainLevel = this.terrainLevel;
			result.ShoreRoughness = this.shoreRoughness;
			result.TerrainBlockIndex = this.terrainBlockIndex;
			result.TerrainOceanBlockIndex = this.terrainOceanBlockIndex;
			result.TemperatureOffset = this.temperatureOffset;
			result.HumidityOffset = this.humidityOffset;
			result.SeaLevelOffset = this.seaLevelOffset;
			result.BiomeSize = this.biomeSize;
			result.StartingPositionMode = this.startingPositionMode;
		}

		return result;
	}
}

export default WorldSetting;
