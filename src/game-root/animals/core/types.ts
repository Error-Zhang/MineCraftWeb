import { Vector3 } from "@babylonjs/core";

/**
 * 动物类型枚举
 */
export enum AnimalType {
	Cow = "Cow",
	Wildboar = "Wildboar",
}

/**
 * 生成位置类型
 */
export enum SpawnLocationType {
	Surface = "Surface", // 地表
	Cave = "Cave", // 洞穴
	Water = "Water", // 水中
	Underground = "Underground", // 地下
	Tree = "Tree", // 树上
	Sky = "Sky", // 空中
}

/**
 * 生物类别
 */
export enum CreatureCategory {
	LandPredator = 1, // 陆地肉食动物
	LandOther = 2, // 陆地其他动物
	Bird = 16, // 鸟类
}

/**
 * 动物行为状态
 */
export enum AnimalBehaviorState {
	Idle = "Idle", // 空闲
	Walking = "Walking", // 行走
	Running = "Running", // 奔跑
	Eating = "Eating", // 进食
	Sleeping = "Sleeping", // 睡眠
	Hunting = "Hunting", // 狩猎
	Fleeing = "Fleeing", // 逃跑
	Following = "Following", // 跟随
	Attacking = "Attacking", // 攻击
	Grazing = "Grazing", // 吃草
	Flying = "Flying", // 飞行
	Swimming = "Swimming", // 游泳
	Herding = "Herding", // 群体行为
}

/**
 * 动物AI行为类型
 */
export enum BehaviorType {
	WalkAround = "WalkAround",
	Chase = "Chase",
	RunAway = "RunAway",
	EatPickable = "EatPickable",
	Herd = "Herd",
	FlyAround = "FlyAround",
	SwimAround = "SwimAround",
	Hunt = "Hunt",
	Graze = "Graze",
	Sleep = "Sleep",
	LayEgg = "LayEgg",
	Howl = "Howl",
	LookAround = "LookAround",
}

/**
 * 生物群系信息
 */
export interface BiomeInfo {
	temperature: number; // 温度 (0-15)
	humidity: number; // 湿度 (0-15)
	elevation: number; // 海拔高度
	distanceToWater: number; // 到水源距离
	forestDensity: number; // 森林密度 (0-1)
	grassDensity: number; // 草地密度 (0-1)
	rockDensity: number; // 岩石密度 (0-1)
	lightLevel: number; // 光照等级 (0-15)
	isUnderground: boolean; // 是否地下
	isNearWater: boolean; // 是否靠近水源
	biomeType: BiomeType; // 生物群系类型
}

/**
 * 生物群系类型
 */
export enum BiomeType {
	Plains = "Plains", // 平原
	Forest = "Forest", // 森林
	Desert = "Desert", // 沙漠
	Mountains = "Mountains", // 山地
	Ocean = "Ocean", // 海洋
	River = "River", // 河流
	Swamp = "Swamp", // 沼泽
	Tundra = "Tundra", // 苔原
	Cave = "Cave", // 洞穴
	Beach = "Beach", // 海滩
}

/**
 * 动物配置接口
 */
export interface AnimalConfig {
	type: AnimalType;
	category: CreatureCategory;
	displayName: string;
	description: string;

	// 基础属性
	health: number;
	speed: number;
	size: number;

	// 行为配置
	behaviors: BehaviorType[];
	aggressiveness: number; // 攻击性 (0-1)
	fearfulness: number; // 胆怯程度 (0-1)
	socialness: number; // 社交性 (0-1)

	// 生成配置
	spawnWeight: number; // 生成权重
	maxGroupSize: number; // 最大群体大小
	minGroupSize: number; // 最小群体大小

	// 环境需求
	preferredBiomes: BiomeType[];
	avoidedBiomes: BiomeType[];
	temperatureRange: [number, number];
	humidityRange: [number, number];

	// 食物偏好
	foodTypes: FoodType[];

	// 声音配置
	sounds: {
		idle?: string;
		attack?: string;
		pain?: string;
		death?: string;
		ambient?: string;
	};

	// 模型配置
	modelPath: string;
	textureVariants?: string[];
	scale: number;

	// 动画配置
	animations: {
		idle: string;
		walk: string;
		run: string;
		attack?: string;
		eat?: string;
		sleep?: string;
	};
}

/**
 * 食物类型
 */
export enum FoodType {
	None = 0,
	Grass = 1,
	Seeds = 2,
	Meat = 4,
	Fish = 8,
	Insects = 16,
	Fruits = 32,
	Vegetables = 64,
	Grains = 128,
}

/**
 * 动物状态数据
 */
export interface AnimalStateData {
	id: number;
	type: AnimalType;
	position: Vector3;
	rotation: Vector3;
	velocity: Vector3;
	health: number;
	maxHealth: number;
	currentBehavior: BehaviorType;
	behaviorState: AnimalBehaviorState;
	targetPosition?: Vector3;
	targetAnimalId?: number;
	lastFeedTime: number;
	lastAttackTime: number;
	isConstantSpawn: boolean;
	groupId?: string;

	// 行为相关状态
	importanceLevel: number;
	stuckTime: number;
	chaseTime: number;
	fleeTime: number;
	idleTime: number;

	// 环境感知
	nearbyAnimals: number[];
	nearbyPlayers: number[];
	visibleFood: Vector3[];
	threats: number[];
}

/**
 * 行为组件接口
 */
export interface IBehaviorComponent {
	readonly behaviorType: BehaviorType;
	readonly importanceLevel: number;
	readonly isActive: boolean;

	update(deltaTime: number, animalState: AnimalStateData): void;

	canActivate(animalState: AnimalStateData): boolean;

	onActivate(animalState: AnimalStateData): void;

	onDeactivate(animalState: AnimalStateData): void;

	dispose(): void;
}

/**
 * 状态机状态接口
 */
export interface IStateMachineState {
	name: string;
	onEnter?: () => void;
	onUpdate?: (deltaTime: number) => void;
	onExit?: () => void;
	canTransitionTo?: (targetState: string) => boolean;
}

/**
 * 寻路结果
 */
export interface PathfindingResult {
	path: Vector3[];
	isComplete: boolean;
	isBlocked: boolean;
	targetReached: boolean;
	nextWaypoint?: Vector3;
}

/**
 * 环境感知数据
 */
export interface EnvironmentData {
	nearbyAnimals: {
		id: number;
		type: AnimalType;
		position: Vector3;
		distance: number;
		isHostile: boolean;
	}[];

	nearbyPlayers: {
		id: number;
		position: Vector3;
		distance: number;
	}[];

	visibleFood: {
		position: Vector3;
		foodType: FoodType;
		distance: number;
	}[];

	obstacles: Vector3[];
	safeSpots: Vector3[];
	waterSources: Vector3[];

	lightLevel: number;
	temperature: number;
	timeOfDay: number; // 0-1
	weather: WeatherType;
}

/**
 * 天气类型
 */
export enum WeatherType {
	Clear = "Clear",
	Rain = "Rain",
	Storm = "Storm",
	Snow = "Snow",
	Fog = "Fog",
}

/**
 * 动物事件类型
 */
export enum AnimalEventType {
	Spawned = "Spawned",
	Despawned = "Despawned",
	HealthChanged = "HealthChanged",
	BehaviorChanged = "BehaviorChanged",
	StateChanged = "StateChanged",
	Attacked = "Attacked",
	Fed = "Fed",
	Died = "Died",
	GroupFormed = "GroupFormed",
	GroupLeft = "GroupLeft",
}

/**
 * 动物事件数据
 */
export interface AnimalEvent {
	type: AnimalEventType;
	animalId: number;
	data?: any;
}
