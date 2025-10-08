import { Vector3 } from "@babylonjs/core";

/**
 * Idle行为配置
 */
export interface IdleBehaviorConfig {
	// 基础参数
	idleDuration: [number, number]; // Idle持续时间范围 [最小, 最大] (毫秒)
	walkProbability: number; // 开始行走的概率 (0-1)

	// 移动参数
	moveDistance: [number, number]; // 移动距离范围 [最小, 最大]
	moveSpeed: number; // 移动速度 (格/秒)

	// 特殊行为
	canFly: boolean; // 是否可以飞行
	canSwim: boolean; // 是否可以游泳

	// 行为模式
	behaviorPattern: "wander" | "patrol" | "circle" | "hover" | "swim"; // 行为模式
}

/**
 * 动物行为配置映射
 */
export const ANIMAL_BEHAVIOR_CONFIGS: Record<string, IdleBehaviorConfig> = {
	// ========== 陆地食草动物 ==========
	Cow: {
		idleDuration: [3000, 6000],
		walkProbability: 0.4,
		moveDistance: [3, 8],
		moveSpeed: 2, // 2格/秒
		canFly: false,
		canSwim: false,
		behaviorPattern: "wander",
	},

	Horse: {
		idleDuration: [2000, 5000],
		walkProbability: 0.5,
		moveDistance: [5, 15],
		moveSpeed: 6, // 6格/秒
		canFly: false,
		canSwim: false,
		behaviorPattern: "wander",
	},

	Donkey: {
		idleDuration: [3000, 7000],
		walkProbability: 0.3,
		moveDistance: [3, 10],
		moveSpeed: 3, // 3格/秒
		canFly: false,
		canSwim: false,
		behaviorPattern: "wander",
	},

	Zebra: {
		idleDuration: [2000, 4000],
		walkProbability: 0.6,
		moveDistance: [5, 12],
		moveSpeed: 6.5, // 6.5格/秒
		canFly: false,
		canSwim: false,
		behaviorPattern: "wander",
	},

	Bison: {
		idleDuration: [4000, 8000],
		walkProbability: 0.3,
		moveDistance: [3, 8],
		moveSpeed: 2.5, // 2.5格/秒
		canFly: false,
		canSwim: false,
		behaviorPattern: "wander",
	},

	Camel: {
		idleDuration: [5000, 10000],
		walkProbability: 0.25,
		moveDistance: [4, 12],
		moveSpeed: 3.5, // 3.5格/秒
		canFly: false,
		canSwim: false,
		behaviorPattern: "wander",
	},

	Giraffe: {
		idleDuration: [4000, 8000],
		walkProbability: 0.35,
		moveDistance: [5, 15],
		moveSpeed: 4, // 4格/秒
		canFly: false,
		canSwim: false,
		behaviorPattern: "wander",
	},

	Rhino: {
		idleDuration: [5000, 10000],
		walkProbability: 0.2,
		moveDistance: [3, 8],
		moveSpeed: 2, // 2格/秒
		canFly: false,
		canSwim: false,
		behaviorPattern: "wander",
	},

	Moose: {
		idleDuration: [4000, 8000],
		walkProbability: 0.4,
		moveDistance: [4, 10],
		moveSpeed: 3, // 3格/秒
		canFly: false,
		canSwim: true,
		behaviorPattern: "wander",
	},

	Reindeer: {
		idleDuration: [3000, 6000],
		walkProbability: 0.5,
		moveDistance: [5, 12],
		moveSpeed: 4, // 4格/秒
		canFly: false,
		canSwim: false,
		behaviorPattern: "wander",
	},

	// ========== 陆地食肉动物 ==========
	Wolf: {
		idleDuration: [2000, 4000],
		walkProbability: 0.6,
		moveDistance: [5, 15],
		moveSpeed: 7, // 7格/秒
		canFly: false,
		canSwim: false,
		behaviorPattern: "patrol",
	},

	Bear: {
		idleDuration: [4000, 8000],
		walkProbability: 0.4,
		moveDistance: [4, 10],
		moveSpeed: 3.5, // 3.5格/秒
		canFly: false,
		canSwim: true,
		behaviorPattern: "wander",
	},

	PolarBear: {
		idleDuration: [4000, 8000],
		walkProbability: 0.4,
		moveDistance: [4, 12],
		moveSpeed: 4, // 4格/秒
		canFly: false,
		canSwim: true,
		behaviorPattern: "wander",
	},

	Lion: {
		idleDuration: [5000, 10000],
		walkProbability: 0.3,
		moveDistance: [3, 10],
		moveSpeed: 8, // 8格/秒
		canFly: false,
		canSwim: false,
		behaviorPattern: "patrol",
	},

	Tiger: {
		idleDuration: [4000, 8000],
		walkProbability: 0.4,
		moveDistance: [4, 12],
		moveSpeed: 8, // 8格/秒
		canFly: false,
		canSwim: true,
		behaviorPattern: "patrol",
	},

	Leopard: {
		idleDuration: [3000, 6000],
		walkProbability: 0.5,
		moveDistance: [5, 15],
		moveSpeed: 9, // 9格/秒
		canFly: false,
		canSwim: false,
		behaviorPattern: "patrol",
	},

	Jaguar: {
		idleDuration: [3000, 6000],
		walkProbability: 0.5,
		moveDistance: [5, 15],
		moveSpeed: 8, // 8格/秒
		canFly: false,
		canSwim: true,
		behaviorPattern: "patrol",
	},

	Hyena: {
		idleDuration: [2000, 5000],
		walkProbability: 0.6,
		moveDistance: [5, 12],
		moveSpeed: 6.5, // 6.5格/秒
		canFly: false,
		canSwim: false,
		behaviorPattern: "patrol",
	},

	Wildboar: {
		idleDuration: [3000, 6000],
		walkProbability: 0.5,
		moveDistance: [4, 10],
		moveSpeed: 5.5, // 5.5格/秒
		canFly: false,
		canSwim: false,
		behaviorPattern: "wander",
	},

	// ========== 飞行鸟类 ==========
	Sparrow: {
		idleDuration: [1000, 3000],
		walkProbability: 0.8,
		moveDistance: [5, 15],
		moveSpeed: 10, // 10格/秒
		canFly: true,
		canSwim: false,
		behaviorPattern: "hover",
	},

	Raven: {
		idleDuration: [2000, 5000],
		walkProbability: 0.7,
		moveDistance: [8, 20],
		moveSpeed: 9, // 9格/秒
		canFly: true,
		canSwim: false,
		behaviorPattern: "circle",
	},

	Seagull: {
		idleDuration: [2000, 4000],
		walkProbability: 0.7,
		moveDistance: [10, 25],
		moveSpeed: 11, // 11格/秒
		canFly: true,
		canSwim: true,
		behaviorPattern: "circle",
	},

	Pigeon: {
		idleDuration: [1500, 4000],
		walkProbability: 0.7,
		moveDistance: [5, 12],
		moveSpeed: 9.5, // 9.5格/秒
		canFly: true,
		canSwim: false,
		behaviorPattern: "hover",
	},

	Duck: {
		idleDuration: [2000, 5000],
		walkProbability: 0.6,
		moveDistance: [3, 10],
		moveSpeed: 4, // 4格/秒
		canFly: true,
		canSwim: true,
		behaviorPattern: "wander",
	},

	// ========== 地面鸟类 ==========
	Cassowary: {
		idleDuration: [3000, 6000],
		walkProbability: 0.5,
		moveDistance: [4, 10],
		moveSpeed: 7, // 7格/秒
		canFly: false,
		canSwim: false,
		behaviorPattern: "wander",
	},

	Ostrich: {
		idleDuration: [2000, 5000],
		walkProbability: 0.6,
		moveDistance: [8, 20],
		moveSpeed: 9, // 9格/秒
		canFly: false,
		canSwim: false,
		behaviorPattern: "wander",
	},

	// ========== 鱼类 ==========
	Fish: {
		idleDuration: [1000, 3000],
		walkProbability: 0.9,
		moveDistance: [3, 8],
		moveSpeed: 6, // 6格/秒
		canFly: false,
		canSwim: true,
		behaviorPattern: "swim",
	},

	Bass: {
		idleDuration: [1500, 4000],
		walkProbability: 0.8,
		moveDistance: [4, 10],
		moveSpeed: 7, // 7格/秒
		canFly: false,
		canSwim: true,
		behaviorPattern: "swim",
	},

	Barracuda: {
		idleDuration: [1000, 2500],
		walkProbability: 0.9,
		moveDistance: [5, 15],
		moveSpeed: 10, // 10格/秒
		canFly: false,
		canSwim: true,
		behaviorPattern: "swim",
	},

	Piranha: {
		idleDuration: [800, 2000],
		walkProbability: 0.95,
		moveDistance: [3, 8],
		moveSpeed: 8, // 8格/秒
		canFly: false,
		canSwim: true,
		behaviorPattern: "swim",
	},

	Orca: {
		idleDuration: [2000, 5000],
		walkProbability: 0.7,
		moveDistance: [10, 25],
		moveSpeed: 13, // 13格/秒
		canFly: false,
		canSwim: true,
		behaviorPattern: "swim",
	},

	Beluga: {
		idleDuration: [2000, 5000],
		walkProbability: 0.7,
		moveDistance: [8, 20],
		moveSpeed: 11, // 11格/秒
		canFly: false,
		canSwim: true,
		behaviorPattern: "swim",
	},

	Ray: {
		idleDuration: [3000, 6000],
		walkProbability: 0.6,
		moveDistance: [5, 12],
		moveSpeed: 4, // 4格/秒
		canFly: false,
		canSwim: true,
		behaviorPattern: "swim",
	},

	Shark_Bull: {
		idleDuration: [2000, 4000],
		walkProbability: 0.8,
		moveDistance: [8, 20],
		moveSpeed: 12, // 12格/秒
		canFly: false,
		canSwim: true,
		behaviorPattern: "patrol",
	},

	Shark_GreatWhite: {
		idleDuration: [2000, 4000],
		walkProbability: 0.8,
		moveDistance: [10, 25],
		moveSpeed: 13, // 13格/秒
		canFly: false,
		canSwim: true,
		behaviorPattern: "patrol",
	},

	Shark_Tiger: {
		idleDuration: [2000, 4000],
		walkProbability: 0.8,
		moveDistance: [8, 22],
		moveSpeed: 12.5, // 12.5格/秒
		canFly: false,
		canSwim: true,
		behaviorPattern: "patrol",
	},
};

/**
 * 获取动物行为配置
 */
export function getAnimalBehaviorConfig(type: string): IdleBehaviorConfig {
	return (
		ANIMAL_BEHAVIOR_CONFIGS[type] ||
		ANIMAL_BEHAVIOR_CONFIGS.Cow || {
			idleDuration: [3000, 6000],
			walkProbability: 0.5,
			moveDistance: [5, 10],
			moveSpeed: 0.08,
			canFly: false,
			canSwim: false,
			behaviorPattern: "wander",
		}
	);
}

/**
 * 根据行为模式生成目标位置
 */
export function generateTargetPosition(
	currentPos: Vector3,
	config: IdleBehaviorConfig,
	seed?: number
): Vector3 {
	const random = seed !== undefined ? seededRandom(seed) : Math.random();
	const distance =
		config.moveDistance[0] + random * (config.moveDistance[1] - config.moveDistance[0]);

	switch (config.behaviorPattern) {
		case "wander": {
			// 随机游走
			const angle = random * Math.PI * 2;
			return new Vector3(
				currentPos.x + Math.cos(angle) * distance,
				currentPos.y,
				currentPos.z + Math.sin(angle) * distance
			);
		}

		case "patrol": {
			// 巡逻模式 - 倾向于直线移动
			const angle = random * Math.PI * 0.5 - Math.PI * 0.25; // ±45度
			return new Vector3(
				currentPos.x + Math.cos(angle) * distance,
				currentPos.y,
				currentPos.z + Math.sin(angle) * distance
			);
		}

		case "circle": {
			// 圆形飞行
			const angle = random * Math.PI * 2;
			const heightVariation = (random - 0.5) * 3; // ±1.5格高度变化
			return new Vector3(
				currentPos.x + Math.cos(angle) * distance,
				currentPos.y + heightVariation,
				currentPos.z + Math.sin(angle) * distance
			);
		}

		case "hover": {
			// 悬停模式 - 小范围移动
			const angle = random * Math.PI * 2;
			const shortDistance = distance * 0.5;
			const heightVariation = (random - 0.5) * 2; // ±1格高度变化
			return new Vector3(
				currentPos.x + Math.cos(angle) * shortDistance,
				currentPos.y + heightVariation,
				currentPos.z + Math.sin(angle) * shortDistance
			);
		}

		case "swim": {
			// 游泳模式 - 3D移动
			const angle = random * Math.PI * 2;
			const depthVariation = (random - 0.5) * 2; // ±1格深度变化
			return new Vector3(
				currentPos.x + Math.cos(angle) * distance,
				currentPos.y + depthVariation,
				currentPos.z + Math.sin(angle) * distance
			);
		}

		default:
			return currentPos;
	}
}

/**
 * 种子随机数生成器
 */
function seededRandom(seed: number): number {
	const x = Math.sin(seed++) * 10000;
	return x - Math.floor(x);
}
