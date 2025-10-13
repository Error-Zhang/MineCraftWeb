import { Vector3 } from "@babylonjs/core";
import { useWorldStore } from "@/store";
import BlockType from "@/game-root/block-definitions/BlockType.ts";

/**
 * 寻路结果
 */
export interface PathfindingResult {
	isCompleted: boolean;
	isInProgress: boolean;
	pathCost: number;
	positionsChecked: number;
	path: Vector3[];
}

/**
 * 寻路请求
 */
export interface PathfindingRequest {
	start: Vector3;
	end: Vector3;
	minDistance: number;
	boxSize: Vector3;
	maxPositionsToCheck: number;
	result: PathfindingResult;
}

/**
 * 路径节点
 */
interface PathNode {
	x: number;
	y: number;
	z: number;
	g: number; // 从起点到当前节点的实际代价
	h: number; // 从当前节点到终点的启发式代价
	f: number; // f = g + h
	parent: PathNode | null;
}

/**
 * 寻路拥堵管理器
 */
class PathfindingCongestionManager {
	private static readonly CAPACITY = 500;
	private static readonly CAPACITY_LIMIT = 1000;
	private static readonly DECAY_RATE = 20; // per second
	private static congestion = 0;
	private static lastUpdateTime = Date.now();

	public static canPathfind(): boolean {
		this.update();
		return this.congestion < this.CAPACITY;
	}

	public static addCongestion(amount: number): void {
		this.congestion = Math.min(this.congestion + amount, this.CAPACITY_LIMIT);
	}

	private static update(): void {
		const now = Date.now();
		const deltaSeconds = (now - this.lastUpdateTime) / 1000;
		this.congestion = Math.max(this.congestion - this.DECAY_RATE * deltaSeconds, 0);
		this.lastUpdateTime = now;
	}
}

/**
 * 动物配置
 */
export interface AnimalMovementConfig {
	maxJumpHeight: number; // 最大跳跃高度
	canSwim: boolean; // 是否可以游泳
	canFly: boolean; // 是否可以飞行
	preferWater: boolean; // 是否偏好水域（鱼类）
	preferredSpeed: number; // 偏好速度
}

/**
 * 默认动物配置 - 基于实际动物模型
 */
export const DEFAULT_ANIMAL_CONFIGS: Record<string, AnimalMovementConfig> = {
	// 温和食草动物
	Cow: {
		maxJumpHeight: 1,
		canSwim: false,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.08,
	},
	Donkey: {
		maxJumpHeight: 1,
		canSwim: false,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.09,
	},
	Horse: {
		maxJumpHeight: 2,
		canSwim: false,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.15,
	},
	Camel: {
		maxJumpHeight: 1,
		canSwim: false,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.09,
	},
	Bison: {
		maxJumpHeight: 1,
		canSwim: false,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.1,
	},
	Zebra: {
		maxJumpHeight: 2,
		canSwim: false,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.14,
	},
	Giraffe: {
		maxJumpHeight: 1,
		canSwim: false,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.11,
	},
	Rhino: {
		maxJumpHeight: 1,
		canSwim: false,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.09,
	},
	Moose: {
		maxJumpHeight: 1,
		canSwim: true,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.1,
	},
	Reindeer: {
		maxJumpHeight: 1,
		canSwim: true,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.11,
	},

	// 肉食动物
	Bear: {
		maxJumpHeight: 1,
		canSwim: true,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.11,
	},
	PolarBear: {
		maxJumpHeight: 1,
		canSwim: true,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.11,
	},
	Lion: {
		maxJumpHeight: 2,
		canSwim: false,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.16,
	},
	Tiger: {
		maxJumpHeight: 2,
		canSwim: true,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.16,
	},
	Leopard: {
		maxJumpHeight: 2,
		canSwim: true,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.17,
	},
	Jaguar: {
		maxJumpHeight: 2,
		canSwim: true,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.17,
	},
	Wolf: {
		maxJumpHeight: 2,
		canSwim: false,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.15,
	},
	Hyena: {
		maxJumpHeight: 1,
		canSwim: false,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.13,
	},
	Wildboar: {
		maxJumpHeight: 1,
		canSwim: false,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.12,
	},

	// 鸟类
	Sparrow: {
		maxJumpHeight: 0,
		canSwim: false,
		canFly: true,
		preferWater: false,
		preferredSpeed: 0.1,
	},
	Raven: {
		maxJumpHeight: 0,
		canSwim: false,
		canFly: true,
		preferWater: false,
		preferredSpeed: 0.11,
	},
	Seagull: {
		maxJumpHeight: 0,
		canSwim: true,
		canFly: true,
		preferWater: false,
		preferredSpeed: 0.12,
	},
	Pigeon: {
		maxJumpHeight: 0,
		canSwim: false,
		canFly: true,
		preferWater: false,
		preferredSpeed: 0.1,
	},
	Bird: {
		maxJumpHeight: 0,
		canSwim: false,
		canFly: true,
		preferWater: false,
		preferredSpeed: 0.09,
	},
	Cassowary: {
		maxJumpHeight: 2,
		canSwim: false,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.14,
	},
	Ostrich: {
		maxJumpHeight: 2,
		canSwim: false,
		canFly: false,
		preferWater: false,
		preferredSpeed: 0.18,
	},
	Duck: { maxJumpHeight: 0, canSwim: true, canFly: true, preferWater: false, preferredSpeed: 0.07 },

	// 海洋动物（鱼类必须在水中）
	Fish: { maxJumpHeight: 0, canSwim: true, canFly: false, preferWater: true, preferredSpeed: 0.12 },
	Bass: { maxJumpHeight: 0, canSwim: true, canFly: false, preferWater: true, preferredSpeed: 0.13 },
	Barracuda: {
		maxJumpHeight: 0,
		canSwim: true,
		canFly: false,
		preferWater: true,
		preferredSpeed: 0.18,
	},
	Piranha: {
		maxJumpHeight: 0,
		canSwim: true,
		canFly: false,
		preferWater: true,
		preferredSpeed: 0.15,
	},
	Orca: { maxJumpHeight: 0, canSwim: true, canFly: false, preferWater: true, preferredSpeed: 0.2 },
	Beluga: {
		maxJumpHeight: 0,
		canSwim: true,
		canFly: false,
		preferWater: true,
		preferredSpeed: 0.16,
	},
	Ray: { maxJumpHeight: 0, canSwim: true, canFly: false, preferWater: true, preferredSpeed: 0.11 },
	Shark_Bull: {
		maxJumpHeight: 0,
		canSwim: true,
		canFly: false,
		preferWater: true,
		preferredSpeed: 0.19,
	},
	Shark_GreatWhite: {
		maxJumpHeight: 0,
		canSwim: true,
		canFly: false,
		preferWater: true,
		preferredSpeed: 0.22,
	},
	Shark_Tiger: {
		maxJumpHeight: 0,
		canSwim: true,
		canFly: false,
		preferWater: true,
		preferredSpeed: 0.2,
	},
};

/**
 * 确定性A*寻路系统
 * 基于生存战争的寻路系统改进
 */
export class AnimalPathfinder {
	private static readonly MAX_ITERATIONS = 1000; // 最大迭代次数
	private static readonly NEIGHBOR_OFFSETS = [
		{ x: 1, z: 0 }, // 东
		{ x: -1, z: 0 }, // 西
		{ x: 0, z: 1 }, // 北
		{ x: 0, z: -1 }, // 南
		{ x: 1, z: 1 }, // 东北
		{ x: -1, z: 1 }, // 西北
		{ x: 1, z: -1 }, // 东南
		{ x: -1, z: -1 }, // 西南
	];

	/**
	 * 异步寻路（带拥堵控制）
	 * @param start 起点
	 * @param end 终点
	 * @param config 动物移动配置
	 * @param maxPositions 最大检查位置数
	 * @returns PathfindingResult
	 */
	public static async findPathAsync(
		start: Vector3,
		end: Vector3,
		config: AnimalMovementConfig,
		maxPositions: number = 500
	): Promise<PathfindingResult> {
		const result: PathfindingResult = {
			isCompleted: false,
			isInProgress: true,
			pathCost: 0,
			positionsChecked: 0,
			path: [],
		};

		// 检查拥堵
		if (!PathfindingCongestionManager.canPathfind()) {
			result.isCompleted = true;
			result.isInProgress = false;
			return result;
		}

		// 执行寻路
		const path = this.findPath(start, end, config, maxPositions);
		result.path = path || [];
		result.isCompleted = true;
		result.isInProgress = false;

		// 添加拥堵
		PathfindingCongestionManager.addCongestion(result.positionsChecked);

		return result;
	}

	/**
	 * 寻找从起点到终点的路径
	 * @param start 起点
	 * @param end 终点
	 * @param config 动物移动配置
	 * @param maxPositions 最大检查位置数
	 * @returns 路径点数组，如果找不到路径返回null
	 */
	public static findPath(
		start: Vector3,
		end: Vector3,
		config: AnimalMovementConfig,
		maxPositions: number = 500
	): Vector3[] | null {
		const startNode: PathNode = {
			x: Math.floor(start.x),
			y: Math.floor(start.y),
			z: Math.floor(start.z),
			g: 0,
			h: this.heuristic(start.x, start.z, end.x, end.z),
			f: 0,
			parent: null,
		};
		startNode.f = startNode.g + startNode.h;

		const endX = Math.floor(end.x);
		const endZ = Math.floor(end.z);

		const openList: PathNode[] = [startNode];
		const closedSet = new Set<string>();
		const openSet = new Map<string, PathNode>();
		openSet.set(this.nodeKey(startNode), startNode);

		let iterations = 0;
		const maxIterations = Math.min(this.MAX_ITERATIONS, maxPositions);

		while (openList.length > 0 && iterations < maxIterations) {
			iterations++;

			// 找到f值最小的节点（确定性排序）
			openList.sort((a, b) => {
				if (a.f !== b.f) return a.f - b.f;
				if (a.x !== b.x) return a.x - b.x;
				if (a.z !== b.z) return a.z - b.z;
				return a.y - b.y;
			});

			const current = openList.shift()!;
			const currentKey = this.nodeKey(current);
			openSet.delete(currentKey);
			closedSet.add(currentKey);

			// 到达目标
			if (Math.abs(current.x - endX) <= 1 && Math.abs(current.z - endZ) <= 1) {
				const path = this.reconstructPath(current, end);
				// 平滑路径
				return this.smoothPath(path, config);
			}

			// 检查所有邻居
			for (const offset of this.NEIGHBOR_OFFSETS) {
				const neighborX = current.x + offset.x;
				const neighborZ = current.z + offset.z;

				// 检查是否可以移动到邻居位置
				const neighborY = this.findWalkableY(neighborX, neighborZ, current.y, config);
				if (neighborY === null) continue;

				const neighborKey = this.nodeKey({ x: neighborX, y: neighborY, z: neighborZ } as PathNode);
				if (closedSet.has(neighborKey)) continue;

				// 计算移动代价
				const isDiagonal = offset.x !== 0 && offset.z !== 0;
				const moveCost = isDiagonal ? 1.414 : 1.0;
				const heightDiff = Math.abs(neighborY - current.y);
				const jumpPenalty = heightDiff > 0 ? heightDiff * 2 : 0;

				const tentativeG = current.g + moveCost + jumpPenalty;

				const existingNode = openSet.get(neighborKey);
				if (existingNode && tentativeG >= existingNode.g) {
					continue;
				}

				const neighbor: PathNode = {
					x: neighborX,
					y: neighborY,
					z: neighborZ,
					g: tentativeG,
					h: this.heuristic(neighborX, neighborZ, endX, endZ),
					f: 0,
					parent: current,
				};
				neighbor.f = neighbor.g + neighbor.h;

				if (!existingNode) {
					openList.push(neighbor);
					openSet.set(neighborKey, neighbor);
				} else {
					// 更新现有节点
					existingNode.g = neighbor.g;
					existingNode.f = neighbor.f;
					existingNode.parent = current;
				}
			}
		}

		// 找不到路径
		return null;
	}

	/**
	 * 找到指定位置的可行走Y坐标
	 */
	private static findWalkableY(
		x: number,
		z: number,
		currentY: number,
		config: AnimalMovementConfig
	): number | null {
		// 飞行动物可以在空中，不需要地面
		if (config.canFly) {
			// 检查当前高度附近（允许垂直移动）
			for (let dy = -2; dy <= 2; dy++) {
				const checkY = currentY + dy;
				if (this.isWalkable(x, checkY, z, config)) {
					return checkY;
				}
			}
			return null;
		}

		// 鱼类必须在水中
		if (config.preferWater) {
			// 检查当前高度附近（允许垂直游动）
			for (let dy = -2; dy <= 2; dy++) {
				const checkY = currentY + dy;
				if (this.isWalkable(x, checkY, z, config)) {
					return checkY;
				}
			}
			return null;
		}

		// 陆地动物：检查向上跳跃（限制高度）
		for (let dy = 0; dy <= config.maxJumpHeight; dy++) {
			const checkY = currentY + dy;
			if (this.isWalkable(x, checkY, z, config)) {
				return checkY;
			}
		}

		// 检查下方（最多3格）
		for (let dy = -1; dy >= -3; dy--) {
			const checkY = currentY + dy;
			if (this.isWalkable(x, checkY, z, config)) {
				return checkY;
			}
		}

		return null;
	}

	/**
	 * 检查位置是否可行走（根据动物类型）
	 * 基于生存战争的逻辑
	 */
	private static isWalkable(
		x: number,
		y: number,
		z: number,
		config?: AnimalMovementConfig
	): boolean {
		const worldController = useWorldStore.getState().worldController!;

		const blockAt = worldController.getBlock(new Vector3(x, y, z));
		const blockBelow = worldController.getBlock(new Vector3(x, y - 1, z));
		const blockAbove = worldController.getBlock(new Vector3(x, y + 1, z));

		// 判断是否是水方块
		const waterBlock = BlockType[BlockType.WaterBlock];
		const isWater = blockAt?.blockType === waterBlock;
		const isWaterBelow = blockBelow?.blockType === waterBlock;
		const isWaterAbove = blockAbove?.blockType === waterBlock;

		// 判断方块是否存在（非空气）
		const hasBlockAt = blockAt && blockAt.id !== 0;
		const hasBlockBelow = blockBelow && blockBelow.id !== 0;
		const hasBlockAbove = blockAbove && blockAbove.id !== 0;

		if (!config) {
			// 默认陆地动物逻辑
			if (!hasBlockBelow) return false;
			if (hasBlockAt && !isWater) return false;
			if (hasBlockAbove && !isWaterAbove) return false;
			return true;
		}

		// 鱼类：必须在水中（ImmersionFactor > 0.33）
		if (config.preferWater) {
			// 当前位置必须是水
			if (!isWater) return false;
			// 上下至少有一个是水（确保浸没度足够）
			if (!isWaterBelow && !isWaterAbove) return false;
			return true;
		}

		// 飞行动物：可以在空中，但避免飞进实体方块
		if (config.canFly) {
			// 当前位置必须是空气或水
			if (hasBlockAt && !isWater) return false;
			// 头部必须是空的
			if (hasBlockAbove && !isWaterAbove) return false;
			// 不需要地面支撑
			return true;
		}

		// 陆地动物：不能在水中行走（除非会游泳）
		if (!config.canSwim) {
			// 当前位置不能是水
			if (isWater) return false;
			// 脚下不能是水
			if (isWaterBelow) return false;
		}

		// 会游泳的陆地动物：可以在水中，但不能水上漂
		if (config.canSwim && isWater) {
			// 在水中时，下方必须有水或地面
			if (!hasBlockBelow && !isWaterBelow) return false;
			return true;
		}

		// 陆地动物：需要地面支撑
		if (!hasBlockBelow) return false;
		if (isWaterBelow) return false; // 不能站在水上

		// 当前位置必须是空气
		if (hasBlockAt && !isWater) return false;

		// 头部必须有空间
		if (hasBlockAbove && !isWaterAbove) return false;

		return true;
	}

	/**
	 * 启发式函数 - 对角线距离（更准确）
	 * 基于生存战争的启发式算法
	 */
	private static heuristic(x1: number, z1: number, x2: number, z2: number): number {
		const dx = Math.abs(x1 - x2);
		const dz = Math.abs(z1 - z2);
		// 对角线距离：1.41 * min + 1.0 * (max - min)
		if (dx > dz) {
			return 1.41 * dz + 1.0 * (dx - dz);
		}
		return 1.41 * dx + 1.0 * (dz - dx);
	}

	/**
	 * 路径平滑算法
	 * 移除不必要的路径点，基于生存战争的SmoothPath
	 */
	private static smoothPath(path: Vector3[], config: AnimalMovementConfig): Vector3[] {
		if (path.length <= 2) return path;

		const smoothed: Vector3[] = [path[0]];
		let currentIndex = 0;

		while (currentIndex < path.length - 1) {
			let farthestIndex = currentIndex + 1;

			// 尝试找到最远的可直达点
			for (let i = currentIndex + 2; i < path.length; i++) {
				if (this.isPassable(path[currentIndex], path[i], config)) {
					farthestIndex = i;
				} else {
					break;
				}
			}

			if (farthestIndex > currentIndex + 1) {
				// 跳过中间点
				currentIndex = farthestIndex;
				smoothed.push(path[farthestIndex]);
			} else {
				// 保留下一个点
				currentIndex++;
				smoothed.push(path[currentIndex]);
			}
		}

		return smoothed;
	}

	/**
	 * 检查两点之间是否可通行（用于路径平滑）
	 */
	private static isPassable(p1: Vector3, p2: Vector3, config: AnimalMovementConfig): boolean {
		const worldController = useWorldStore.getState().worldController;
		if (!worldController) return false;

		const dx = p2.x - p1.x;
		const dz = p2.z - p1.z;
		const distance = Math.sqrt(dx * dx + dz * dz);

		if (distance < 0.1) return true;

		// 检查路径上的点
		const steps = Math.ceil(distance * 2); // 更密集的检查
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const x = Math.floor(p1.x + dx * t);
			const y = Math.floor(p1.y + (p2.y - p1.y) * t);
			const z = Math.floor(p1.z + dz * t);

			// 检查是否可行走
			if (!this.isWalkable(x, y, z, config)) {
				return false;
			}

			// 检查头部空间
			const blockAbove = worldController.getBlock(new Vector3(x, y + 1, z));
			if (
				blockAbove &&
				blockAbove.id !== 0 &&
				blockAbove.blockType !== BlockType[BlockType.WaterBlock]
			) {
				return false;
			}
		}

		return true;
	}

	/**
	 * 重建路径
	 */
	private static reconstructPath(endNode: PathNode, targetPos: Vector3): Vector3[] {
		const path: Vector3[] = [];
		let current: PathNode | null = endNode;

		while (current !== null) {
			path.unshift(new Vector3(current.x + 0.5, current.y, current.z + 0.5));
			current = current.parent;
		}

		// 添加最终目标点
		if (path.length > 0) {
			path.push(targetPos);
		}

		return path;
	}

	/**
	 * 节点键（用于去重）
	 */
	private static nodeKey(node: PathNode): string {
		return `${node.x},${node.y},${node.z}`;
	}
}
