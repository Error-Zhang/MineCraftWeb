import { Vector3 } from "@babylonjs/core";
import { AnimalPathfinder, AnimalMovementConfig, PathfindingResult } from "./AnimalPathfinder";
import { AnimalPilot } from "./AnimalPilot";

/**
 * 寻路状态
 */
export enum PathfindingState {
	Stopped = "Stopped",
	MovingDirect = "MovingDirect",
	SearchingForPath = "SearchingForPath",
	MovingWithPath = "MovingWithPath",
	MovingRandomly = "MovingRandomly",
	Stuck = "Stuck",
}

/**
 * 寻路状态机
 * 基于生存战争的ComponentPathfinding实现
 */
export class PathfindingStateMachine {
	private state: PathfindingState = PathfindingState.Stopped;
	private destination: Vector3 | null = null;
	private speed: number = 0;
	private range: number = 0;
	private maxPathfindingPositions: number = 0;
	private useRandomMovements: boolean = false;
	private ignoreHeightDifference: boolean = false;
	private raycastDestination: boolean = false;

	private pilot: AnimalPilot;
	private pathfindingResult: PathfindingResult = {
		isCompleted: false,
		isInProgress: false,
		pathCost: 0,
		positionsChecked: 0,
		path: [],
	};

	private lastPathfindingDestination: Vector3 | null = null;
	private lastPathfindingTime: number = 0;
	private readonly MIN_PATHFINDING_PERIOD = 6000; // ms
	private readonly PATHFINDING_RETRY_DELAY = 8000; // ms

	private randomMoveCount: number = 0;
	private destinationChanged: boolean = false;

	constructor(private config: AnimalMovementConfig) {
		this.pilot = new AnimalPilot(config);
	}

	/**
	 * 设置目标
	 */
	public setDestination(
		destination: Vector3 | null,
		speed: number,
		range: number,
		maxPathfindingPositions: number,
		useRandomMovements: boolean,
		ignoreHeightDifference: boolean,
		raycastDestination: boolean
	): void {
		this.destination = destination;
		this.speed = speed;
		this.range = range;
		this.maxPathfindingPositions = maxPathfindingPositions;
		this.useRandomMovements = useRandomMovements;
		this.ignoreHeightDifference = ignoreHeightDifference;
		this.raycastDestination = raycastDestination;
		this.destinationChanged = true;
	}

	/**
	 * 停止
	 */
	public stop(): void {
		this.setDestination(null, 0, 0, 0, false, false, false);
		this.pilot.stop();
		this.state = PathfindingState.Stopped;
		this.randomMoveCount = 0;
	}

	/**
	 * 是否卡住
	 */
	public isStuck(): boolean {
		return this.state === PathfindingState.Stuck || this.pilot.getIsStuck();
	}

	/**
	 * 获取当前状态
	 */
	public getState(): PathfindingState {
		return this.state;
	}

	/**
	 * 更新状态机
	 */
	public async update(currentPosition: Vector3, deltaTime: number): Promise<Vector3 | null> {
		const now = Date.now();

		switch (this.state) {
			case PathfindingState.Stopped:
				return this.updateStopped();

			case PathfindingState.MovingDirect:
				return await this.updateMovingDirect(currentPosition, deltaTime, now);

			case PathfindingState.SearchingForPath:
				return await this.updateSearchingForPath(currentPosition, now);

			case PathfindingState.MovingWithPath:
				return await this.updateMovingWithPath(currentPosition, deltaTime, now);

			case PathfindingState.MovingRandomly:
				return this.updateMovingRandomly(currentPosition, deltaTime);

			case PathfindingState.Stuck:
				return this.updateStuck();

			default:
				return null;
		}
	}

	/**
	 * Stopped状态
	 */
	private updateStopped(): Vector3 | null {
		if (this.destination) {
			this.state = PathfindingState.MovingDirect;
		}
		return null;
	}

	/**
	 * MovingDirect状态 - 直接朝目标移动
	 */
	private async updateMovingDirect(
		currentPosition: Vector3,
		deltaTime: number,
		now: number
	): Promise<Vector3 | null> {
		if (!this.destination) {
			this.state = PathfindingState.Stopped;
			return null;
		}

		// 目标改变时，更新pilot
		if (this.destinationChanged) {
			this.pilot.setDestination(
				this.destination,
				this.speed,
				this.range,
				this.ignoreHeightDifference,
				this.raycastDestination,
				this.speed >= 1
			);
			this.destinationChanged = false;
		}

		// 更新pilot
		const moveVector = this.pilot.update(currentPosition, deltaTime);

		// 检查pilot是否完成
		if (!this.pilot.getDestination()) {
			this.state = PathfindingState.Stopped;
			return null;
		}

		// 检查是否卡住
		if (this.pilot.getIsStuck()) {
			if (this.maxPathfindingPositions > 0) {
				this.state = PathfindingState.SearchingForPath;
			} else if (this.useRandomMovements) {
				this.state = PathfindingState.MovingRandomly;
			} else {
				this.state = PathfindingState.Stuck;
			}
			return null;
		}

		return moveVector;
	}

	/**
	 * SearchingForPath状态 - 搜索路径
	 */
	private async updateSearchingForPath(currentPosition: Vector3, now: number): Promise<Vector3 | null> {
		if (!this.destination) {
			this.state = PathfindingState.Stopped;
			return null;
		}

		// 检查是否可以开始寻路
		if (
			!this.pathfindingResult.isInProgress &&
			(this.lastPathfindingTime === 0 || now - this.lastPathfindingTime > this.PATHFINDING_RETRY_DELAY)
		) {
			this.lastPathfindingDestination = this.destination.clone();
			this.lastPathfindingTime = now;

			// 异步寻路
			this.pathfindingResult = await AnimalPathfinder.findPathAsync(
				currentPosition,
				this.destination,
				this.config,
				this.maxPathfindingPositions
			);
		}

		// 如果寻路未完成，尝试随机移动
		if (!this.pathfindingResult.isCompleted && this.useRandomMovements) {
			this.state = PathfindingState.MovingRandomly;
			return null;
		}

		// 寻路完成
		if (this.pathfindingResult.isCompleted) {
			if (this.pathfindingResult.path.length > 0) {
				this.state = PathfindingState.MovingWithPath;
			} else if (this.useRandomMovements) {
				this.state = PathfindingState.MovingRandomly;
			} else {
				this.state = PathfindingState.Stuck;
			}
		}

		return null;
	}

	/**
	 * MovingWithPath状态 - 沿路径移动
	 */
	private async updateMovingWithPath(
		currentPosition: Vector3,
		deltaTime: number,
		now: number
	): Promise<Vector3 | null> {
		if (!this.destination) {
			this.state = PathfindingState.Stopped;
			return null;
		}

		// 如果没有当前目标，从路径中取下一个点
		if (!this.pilot.getDestination()) {
			if (this.pathfindingResult.path.length > 0) {
				const nextWaypoint = this.pathfindingResult.path.shift()!;
				this.pilot.setDestination(
					nextWaypoint,
					Math.min(this.speed, 0.75),
					0.75,
					false,
					false,
					this.speed >= 1
				);
			} else {
				// 路径走完，切换到直接移动
				this.state = PathfindingState.MovingDirect;
				return null;
			}
		}

		// 更新pilot
		const moveVector = this.pilot.update(currentPosition, deltaTime);

		// 检查是否卡住
		if (this.pilot.getIsStuck()) {
			if (this.useRandomMovements) {
				this.state = PathfindingState.MovingRandomly;
			} else {
				this.state = PathfindingState.Stuck;
			}
			return null;
		}

		// 检查目标是否改变（更近了）
		if (this.lastPathfindingDestination) {
			const distToDest = Vector3.DistanceSquared(currentPosition, this.destination);
			const distToLastDest = Vector3.DistanceSquared(this.lastPathfindingDestination, this.destination);
			if (distToLastDest > distToDest) {
				// 目标更近了，重新直接移动
				this.state = PathfindingState.MovingDirect;
				return null;
			}
		}

		return moveVector;
	}

	/**
	 * MovingRandomly状态 - 随机移动
	 */
	private updateMovingRandomly(currentPosition: Vector3, deltaTime: number): Vector3 | null {
		if (!this.destination) {
			this.state = PathfindingState.Stopped;
			return null;
		}

		// 设置随机目标
		if (!this.pilot.getDestination()) {
			const randomOffset = new Vector3(
				(Math.random() - 0.5) * 10,
				0,
				(Math.random() - 0.5) * 10
			);
			const randomTarget = currentPosition.add(randomOffset);
			this.pilot.setDestination(randomTarget, 1, 1, true, false, false);
			this.randomMoveCount++;
		}

		// 检查随机移动次数
		if (this.randomMoveCount > 3) {
			this.state = PathfindingState.Stuck;
			return null;
		}

		// 更新pilot
		const moveVector = this.pilot.update(currentPosition, deltaTime);

		// 检查是否卡住或完成
		if (this.pilot.getIsStuck() || !this.pilot.getDestination()) {
			this.state = PathfindingState.MovingDirect;
			return null;
		}

		return moveVector;
	}

	/**
	 * Stuck状态 - 卡住
	 */
	private updateStuck(): Vector3 | null {
		if (!this.destination) {
			this.state = PathfindingState.Stopped;
			return null;
		}

		// 如果目标改变，重试
		if (this.destinationChanged) {
			this.destinationChanged = false;
			this.randomMoveCount = 0;
			this.state = PathfindingState.MovingDirect;
		}

		return null;
	}
}
