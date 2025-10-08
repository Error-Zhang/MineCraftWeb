import { Vector3 } from "@babylonjs/core";
import { useWorldStore } from "@/store";
import BlockType from "@/game-root/block-definitions/BlockType.ts";

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
 * 使用相同输入保证所有客户端计算出相同路径
 */
export class AnimalPathfinder {
	private static readonly MAX_ITERATIONS = 500; // 最大迭代次数
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
	 * 寻找从起点到终点的路径
	 * @param start 起点
	 * @param end 终点
	 * @param config 动物移动配置
	 * @returns 路径点数组，如果找不到路径返回null
	 */
	public static findPath(
		start: Vector3,
		end: Vector3,
		config: AnimalMovementConfig
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

		while (openList.length > 0 && iterations < this.MAX_ITERATIONS) {
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
				return this.reconstructPath(current, end);
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
	 * 简化版寻路 - 直接朝目标移动（用于短距离）
	 */
	public static findSimplePath(
		start: Vector3,
		end: Vector3,
		config: AnimalMovementConfig
	): Vector3[] | null {
		const path: Vector3[] = [];
		const startX = Math.floor(start.x);
		const startZ = Math.floor(start.z);
		const endX = Math.floor(end.x);
		const endZ = Math.floor(end.z);

		const dx = endX - startX;
		const dz = endZ - startZ;
		const distance = Math.sqrt(dx * dx + dz * dz);

		if (distance < 0.1) return [end];

		const steps = Math.ceil(distance);
		const stepX = dx / steps;
		const stepZ = dz / steps;

		let currentY = Math.floor(start.y);

		for (let i = 1; i <= steps; i++) {
			const x = Math.floor(startX + stepX * i);
			const z = Math.floor(startZ + stepZ * i);

			const y = this.findWalkableY(x, z, currentY, config);
			if (y === null) {
				// 遇到障碍，使用完整A*
				return this.findPath(start, end, config);
			}

			path.push(new Vector3(x + 0.5, y, z + 0.5));
			currentY = y;
		}

		return path;
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
		// 检查当前高度附近
		for (let dy = 0; dy <= config.maxJumpHeight; dy++) {
			const checkY = currentY + dy;
			if (this.isWalkable(x, checkY, z, config)) {
				return checkY;
			}
		}

		// 检查下方
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

		// 鱼类：必须在水中
		if (config.preferWater) {
			// 当前位置必须是水
			if (!isWater) return false;
			// 上方和下方至少有一个是水（确保在水体中）
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

		// 陆地动物：不能在水面上走
		if (!config.canSwim) {
			// 脚下不能是水
			if (isWaterBelow) return false;
			// 当前位置不能是水
			if (isWater) return false;
		}

		// 需要地面支撑（非空气且非水）
		if (!hasBlockBelow || isWaterBelow) return false;

		// 当前位置必须是空气或水（如果会游泳）
		if (hasBlockAt) {
			if (isWater && config.canSwim) {
				// 会游泳的动物可以在水中
				return true;
			}
			return false;
		}

		// 头部必须有空间
		if (hasBlockAbove && !isWaterAbove) return false;

		return true;
	}

	/**
	 * 启发式函数 - 曼哈顿距离
	 */
	private static heuristic(x1: number, z1: number, x2: number, z2: number): number {
		return Math.abs(x1 - x2) + Math.abs(z1 - z2);
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
