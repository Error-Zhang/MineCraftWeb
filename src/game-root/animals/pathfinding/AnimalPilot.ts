import { Vector3 } from "@babylonjs/core";
import { useWorldStore } from "@/store";
import BlockType from "@/game-root/block-definitions/BlockType.ts";
import { AnimalMovementConfig } from "./AnimalPathfinder";

/**
 * 动物导航组件
 * 基于生存战争的ComponentPilot实现
 * 负责低级移动控制、障碍避让和卡住检测
 */
export class AnimalPilot {
	private destination: Vector3 | null = null;
	private speed: number = 0;
	private range: number = 0;
	private ignoreHeightDifference: boolean = false;
	private raycastDestination: boolean = false;
	private takeRisks: boolean = false;

	// 卡住检测
	private isStuck: boolean = false;
	private lastStuckCheckTime: number = 0;
	private lastStuckCheckPosition: Vector3 | null = null;
	private stuckCount: number = 0;
	private readonly STUCK_CHECK_INTERVAL = 400; // ms
	private readonly STUCK_THRESHOLD = 4; // 连续4次未移动判定为卡住
	private readonly MIN_MOVE_DISTANCE = 0.2; // 最小移动距离

	// 高度差检测
	private aboveBelowTime: number | null = null;
	private readonly ABOVE_BELOW_TIMEOUT = 2000; // ms

	// 最大坠落高度
	private readonly MAX_FALL_HEIGHT = 5;
	private readonly MAX_FALL_HEIGHT_RISK = 7;

	constructor(private config: AnimalMovementConfig) {}

	/**
	 * 设置目标位置
	 */
	public setDestination(
		destination: Vector3 | null,
		speed: number,
		range: number,
		ignoreHeightDifference: boolean = false,
		raycastDestination: boolean = false,
		takeRisks: boolean = false
	): void {
		// 如果目标方向改变较大，重置卡住状态
		if (this.destination && destination) {
			const oldDir = this.destination.subtract(new Vector3(0, 0, 0)).normalize();
			const newDir = destination.subtract(new Vector3(0, 0, 0)).normalize();
			if (Vector3.Dot(oldDir, newDir) < 0.5) {
				this.resetStuckState();
			}
		} else {
			this.resetStuckState();
		}

		this.destination = destination;
		this.speed = speed;
		this.range = range;
		this.ignoreHeightDifference = ignoreHeightDifference;
		this.raycastDestination = raycastDestination;
		this.takeRisks = takeRisks;
	}

	/**
	 * 停止移动
	 */
	public stop(): void {
		this.setDestination(null, 0, 0, false, false, false);
	}

	/**
	 * 获取当前目标
	 */
	public getDestination(): Vector3 | null {
		return this.destination;
	}

	/**
	 * 是否卡住
	 */
	public getIsStuck(): boolean {
		return this.isStuck;
	}

	/**
	 * 更新导航（返回移动向量）
	 */
	public update(currentPosition: Vector3, deltaTime: number): Vector3 | null {
		if (!this.destination) {
			return null;
		}

		const now = Date.now();

		// 检查卡住状态
		this.checkStuck(currentPosition, now);

		// 计算到目标的向量
		const toDestination = this.destination.subtract(currentPosition);
		const distanceSq = toDestination.lengthSquared();
		const horizontalDistance = new Vector3(toDestination.x, 0, toDestination.z).lengthSquared();

		// 检查是否到达目标
		const targetDistanceSq = this.ignoreHeightDifference ? horizontalDistance : distanceSq;
		if (targetDistanceSq <= this.range * this.range) {
			// 到达目标
			if (this.raycastDestination) {
				// 需要射线检测确认
				if (!this.hasObstacleBetween(currentPosition, this.destination)) {
					this.destination = null;
					return null;
				}
			} else {
				this.destination = null;
				return null;
			}
		}

		// 检查地形安全性
		if (!this.isTerrainSafeToGo(currentPosition, toDestination)) {
			this.isStuck = true;
			return null;
		}

		// 计算移动方向
		const moveDirection = toDestination.normalize();
		const moveVector = moveDirection.scale(this.speed);

		// 检查高度差
		if (horizontalDistance < 1 && (toDestination.y < -0.5 || toDestination.y > 1)) {
			if (this.aboveBelowTime === null) {
				this.aboveBelowTime = now;
			} else if (now - this.aboveBelowTime > this.ABOVE_BELOW_TIMEOUT) {
				this.isStuck = true;
				return null;
			}
		} else {
			this.aboveBelowTime = null;
		}

		return moveVector;
	}

	/**
	 * 检查卡住状态
	 */
	private checkStuck(currentPosition: Vector3, now: number): void {
		if (now - this.lastStuckCheckTime < this.STUCK_CHECK_INTERVAL) {
			return;
		}

		this.lastStuckCheckTime = now;

		if (!this.lastStuckCheckPosition) {
			this.lastStuckCheckPosition = currentPosition.clone();
			this.stuckCount = 0;
			return;
		}

		// 检查是否移动了足够距离
		const moved = Vector3.Distance(currentPosition, this.lastStuckCheckPosition);
		if (moved > this.MIN_MOVE_DISTANCE) {
			this.lastStuckCheckPosition = currentPosition.clone();
			this.stuckCount = 0;
			this.isStuck = false;
		} else {
			this.stuckCount++;
			if (this.stuckCount >= this.STUCK_THRESHOLD) {
				this.isStuck = true;
			}
		}
	}

	/**
	 * 重置卡住状态
	 */
	private resetStuckState(): void {
		this.isStuck = false;
		this.lastStuckCheckPosition = null;
		this.stuckCount = 0;
		this.aboveBelowTime = null;
	}

	/**
	 * 检查地形是否安全（基于生存战争的IsTerrainSafeToGo）
	 */
	private isTerrainSafeToGo(position: Vector3, direction: Vector3): boolean {
		const worldController = useWorldStore.getState().worldController;
		if (!worldController) return false;

		// 计算移动后的位置
		const directionLength = direction.length();
		const checkDistance = Math.min(directionLength, 1.2);
		const normalizedDir = direction.normalize();
		const checkPos = position.add(normalizedDir.scale(checkDistance));
		checkPos.y += 0.1; // 稍微抬高检查点

		// 检查前方3x3区域
		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				// 只检查朝向前方的方块
				const offset = new Vector3(i, 0, j);
				if (Vector3.Dot(direction, offset) <= 0) {
					continue;
				}

				const checkX = Math.floor(checkPos.x) + i;
				const checkZ = Math.floor(checkPos.z) + j;

				// 检查当前位置、下方一格、下方两格
				for (let dy = 0; dy >= -2; dy--) {
					const checkY = Math.floor(checkPos.y) + dy;
					const block = worldController.getBlock(new Vector3(checkX, checkY, checkZ));

					if (block && block.id !== 0) {
						// 检查是否是危险方块
						if (this.shouldAvoidBlock(block.blockType)) {
							return false;
						}

						// 碰到可碰撞方块，这个方向是安全的
						if (this.isBlockCollidable(block.blockType)) {
							break;
						}
					}
				}
			}
		}

		// 检查坠落高度
		const maxFallHeight = this.takeRisks ? this.MAX_FALL_HEIGHT_RISK : this.MAX_FALL_HEIGHT;
		let foundGround = false;

		for (let dy = 0; dy >= -maxFallHeight && checkPos.y + dy >= 0; dy--) {
			const checkY = Math.floor(checkPos.y) + dy;
			const block = worldController.getBlock(
				new Vector3(Math.floor(checkPos.x), checkY, Math.floor(checkPos.z))
			);

			if (block && block.id !== 0) {
				// 找到地面或液体
				const isWater = block.blockType === BlockType[BlockType.WaterBlock];
				if (this.isBlockCollidable(block.blockType) || isWater) {
					if (!this.shouldAvoidBlock(block.blockType)) {
						foundGround = true;
						break;
					}
				}
			}
		}

		return foundGround;
	}

	/**
	 * 检查方块是否应该避开
	 */
	private shouldAvoidBlock(blockType: string): boolean {
		// 危险方块列表
		const dangerousBlocks = [
			BlockType[BlockType.MagmaBlock], // 岩浆
			BlockType[BlockType.CactusBlock], // 仙人掌
		];

		return dangerousBlocks.includes(blockType);
	}

	/**
	 * 检查方块是否可碰撞
	 */
	private isBlockCollidable(blockType: string): boolean {
		// 非碰撞方块列表
		const nonCollidableBlocks = [
			BlockType[BlockType.WaterBlock],
			BlockType[BlockType.TallGrassBlock],
			BlockType[BlockType.RedFlowerBlock],
			BlockType[BlockType.PurpleFlowerBlock],
			BlockType[BlockType.WhiteFlowerBlock],
			BlockType[BlockType.DryBushBlock],
		];

		// 空气方块 (id === 0) 也是非碰撞的，但在这里通过 id 检查
		return !nonCollidableBlocks.includes(blockType);
	}

	/**
	 * 检查两点之间是否有障碍
	 */
	private hasObstacleBetween(start: Vector3, end: Vector3): boolean {
		const worldController = useWorldStore.getState().worldController;
		if (!worldController) return false;

		const direction = end.subtract(start);
		const distance = direction.length();
		const step = 0.5;
		const steps = Math.ceil(distance / step);

		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const checkPos = start.add(direction.scale(t));
			checkPos.y += 0.5; // 检查眼睛高度

			const block = worldController.getBlock(
				new Vector3(Math.floor(checkPos.x), Math.floor(checkPos.y), Math.floor(checkPos.z))
			);

			if (block && block.id !== 0 && this.isBlockCollidable(block.blockType)) {
				return true;
			}
		}

		return false;
	}
}
