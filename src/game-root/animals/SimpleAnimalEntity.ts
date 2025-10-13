import { AbstractMesh, Scene, TransformNode, Vector3 } from "@babylonjs/core";
import { AnimalMovementConfig, DEFAULT_ANIMAL_CONFIGS } from "./pathfinding/AnimalPathfinder";
import { PathfindingStateMachine, PathfindingState } from "./pathfinding/PathfindingStateMachine";
import AnimalModelCache from "./AnimalModelCache";
import { generateTargetPosition, getAnimalBehaviorConfig, type IdleBehaviorConfig } from "./AnimalBehaviorConfig";
import { useWorldStore } from "@/store";
import BlockType from "@/game-root/block-definitions/BlockType.ts";
import { FlyAroundBehavior } from "./behaviors/FlyAroundBehavior";
import { FishBehavior } from "./behaviors/FishBehavior";
import { GameConfig } from "@/game-root/config/GameConfig";

/**
 * 简化的动物实体
 * 只包含位置、移动和模型管理
 */
export class SimpleAnimalEntity {
	public id: number;
	public type: string;
	public isOwned: boolean = false; // 是否由本客户端控制

	private scene: Scene;
	private rootNode: TransformNode;
	private mesh: AbstractMesh | null = null;
	private position: Vector3;
	private targetPosition: Vector3 | null = null;
	private config: AnimalMovementConfig;
	private behaviorConfig: IdleBehaviorConfig;
	private isMoving: boolean = false;
	private moveSpeed: number = 0.08;

	// 增强寻路系统
	private pathfindingStateMachine: PathfindingStateMachine;

	// 特殊行为
	private flyBehavior?: FlyAroundBehavior;
	private fishBehavior?: FishBehavior;

	// 行为状态
	private behaviorType: string = "Idle"; // Idle, Walk, Flee
	private idleTimer: number = 0;
	private idleDuration: number = 3000; // 当前Idle持续时间
	private randomSeed: number = 0;

	// 物理移动
	private velocity: Vector3 = Vector3.Zero();
	private readonly GRAVITY = -20; // 重力加速度 (格/秒²)
	private readonly GROUND_CHECK_DISTANCE = 0.5; // 地面检测距离
	private isGrounded: boolean = false;
	private immersionFactor: number = 0; // 浸没度 (0-1)
	private isFlying: boolean = false;
	private isSwimming: boolean = false;

	// 朝向控制
	private targetRotation: number = 0;
	private readonly ROTATION_SPEED = 5; // 旋转速度 (弧度/秒)

	constructor(scene: Scene, id: number, type: string, position: Vector3) {
		this.scene = scene;
		this.id = id;
		this.type = type;
		this.position = position.clone();
		this.config = DEFAULT_ANIMAL_CONFIGS[type] || DEFAULT_ANIMAL_CONFIGS.Cow;
		this.behaviorConfig = getAnimalBehaviorConfig(type);
		this.moveSpeed = this.behaviorConfig.moveSpeed;

		// 初始化寻路状态机
		this.pathfindingStateMachine = new PathfindingStateMachine(this.config);

		// 初始化特殊行为
		if (this.config.canFly) {
			this.flyBehavior = new FlyAroundBehavior();
		}
		if (this.config.preferWater) {
			this.fishBehavior = new FishBehavior();
		}

		// 设置随机Idle持续时间
		this.idleDuration = this.getRandomIdleDuration();

		// 创建根节点
		this.rootNode = new TransformNode(`animal_${id}`, scene);
		this.rootNode.position = this.position;
	}

	/**
	 * 加载模型
	 */
	public async loadModel(): Promise<void> {
		try {
			this.mesh = await AnimalModelCache.getModel(this.type, this.scene);
			if (this.mesh) {
				this.mesh.parent = this.rootNode;
				this.mesh.position = Vector3.Zero();
				this.mesh.rotation = Vector3.Zero();
				
				// 初始化时调整到地面高度
				const groundHeight = this.getGroundHeight(this.position.x, this.position.z);
				console.log(`[Animal ${this.type}] Init position: ${this.position.y}, Ground: ${groundHeight}`);
				this.position.y = groundHeight;
				this.rootNode.position.copyFrom(this.position);
			}
		} catch (error) {
			console.error(`Failed to load model for ${this.type}:`, error);
		}
	}

	/**
	 * 更新动物
	 */
	public async update(deltaTime: number): Promise<void> {
		if (!this.isOwned) return; // 非拥有者不更新AI

		// 检查AI开关
		if (!GameConfig.ANIMAL_SYSTEM.enableAI) {
			// AI禁用时，只更新位置，不更新行为
			this.rootNode.position.copyFrom(this.position);
			return;
		}

		// 更新行为
		this.updateBehavior(deltaTime);

		// 更新寻路状态机
		if (this.isMoving) {
			await this.updatePathfinding(deltaTime);
		}

		// 更新位置
		this.rootNode.position.copyFrom(this.position);
	}

	/**
	 * 移动到目标位置（使用增强寻路系统）
	 */
	public moveTo(target: Vector3): void {
		this.targetPosition = target;
		this.isMoving = true;

		// 使用寻路状态机
		const distance = Vector3.Distance(this.position, target);
		const maxPathfindingPositions = distance > 20 ? 800 : 500;

		this.pathfindingStateMachine.setDestination(
			target,
			this.moveSpeed,
			0.5, // range
			maxPathfindingPositions,
			true, // useRandomMovements
			false, // ignoreHeightDifference
			false // raycastDestination
		);
	}

	/**
	 * 处理行为事件（来自网络）
	 */
	public handleBehaviorEvent(behaviorType: string, target: Vector3, seed: number): void {
		this.behaviorType = behaviorType;
		this.randomSeed = seed;

		if (behaviorType === "Walk" || behaviorType === "Flee") {
			this.moveTo(target);
		} else if (behaviorType === "Idle") {
			this.stopMoving();
		}
	}

	/**
	 * 同步位置（来自网络）
	 */
	public syncPosition(position: Vector3): void {
		// 平滑插值到新位置
		this.position.copyFrom(position);
		this.rootNode.position.copyFrom(position);
	}

	/**
	 * 停止移动
	 */
	public stopMoving(): void {
		this.isMoving = false;
		this.targetPosition = null;
		this.pathfindingStateMachine.stop();
	}

	/**
	 * 获取当前位置
	 */
	public getPosition(): Vector3 {
		return this.position.clone();
	}

	/**
	 * 设置位置
	 */
	public setPosition(x: number, y: number, z: number): void {
		this.position.set(x, y, z);
		this.rootNode.position.copyFrom(this.position);
	}

	/**
	 * 获取行为状态
	 */
	public getBehaviorType(): string {
		return this.behaviorType;
	}

	/**
	 * 获取目标位置
	 */
	public getTargetPosition(): Vector3 | null {
		return this.targetPosition;
	}

	/**
	 * 设置是否可见
	 */
	public setEnabled(enabled: boolean): void {
		this.rootNode.setEnabled(enabled);
	}

	/**
	 * 清理
	 */
	public dispose(): void {
		if (this.mesh) {
			AnimalModelCache.releaseModel(this.type, this.mesh);
			this.mesh = null;
		}
		this.rootNode.dispose();
	}

	/**
	 * 获取随机Idle持续时间
	 */
	private getRandomIdleDuration(): number {
		const [min, max] = this.behaviorConfig.idleDuration;
		return min + Math.random() * (max - min);
	}

	/**
	 * 更新行为逻辑
	 */
	private updateBehavior(deltaTime: number): void {
		// 鱼类特殊行为：检查是否离水
		if (this.fishBehavior) {
			const needWater = this.fishBehavior.updateOutOfWaterTime(deltaTime, this.immersionFactor);
			if (needWater) {
				// 紧急寻找水源
				const waterTarget = this.fishBehavior.findWaterDestination(this.position);
				if (waterTarget) {
					this.moveTo(waterTarget);
					this.behaviorType = "Flee"; // 逃离状态
					return;
				}
			}
		}

		if (this.behaviorType === "Idle") {
			this.idleTimer += deltaTime;

			// 根据配置的概率开始移动
			if (this.idleTimer > this.idleDuration) {
				this.idleTimer = 0;
				this.idleDuration = this.getRandomIdleDuration(); // 重新随机一个时间

				if (Math.random() < this.behaviorConfig.walkProbability) {
					this.startRandomWalk();
				}
			}
		} else if (this.behaviorType === "Walk") {
			// 行走中，检查是否到达目标
			if (!this.isMoving) {
				this.behaviorType = "Idle";
				this.idleTimer = 0;
				this.idleDuration = this.getRandomIdleDuration();
				// 鱼类回到水中后重置
				if (this.fishBehavior) {
					this.fishBehavior.reset();
				}
			}
		} else if (this.behaviorType === "Flee") {
			// 逃离状态，到达目标后回到Idle
			if (!this.isMoving) {
				this.behaviorType = "Idle";
				if (this.fishBehavior) {
					this.fishBehavior.reset();
				}
			}
		}
	}

	/**
	 * 开始随机行走
	 */
	private startRandomWalk(): void {
		let target: Vector3;

		// 飞行动物使用特殊的飞行行为
		if (this.flyBehavior) {
			target = this.flyBehavior.generateFlyTarget(this.position);
		}
		// 鱼类使用水中游动行为
		else if (this.fishBehavior) {
			target = this.fishBehavior.generateSwimTarget(this.position);
		}
		// 普通陆地动物
		else {
			target = generateTargetPosition(this.position, this.behaviorConfig);
		}

		this.moveTo(target);
		this.behaviorType = "Walk";
	}

	/**
	 * 获取地面高度
	 */
	private getGroundHeight(x: number, z: number): number {
		const worldController = useWorldStore.getState().worldController;
		if (!worldController) return this.position.y;

		// 从当前位置向下搜索地面（扩大搜索范围）
		const startY = Math.floor(this.position.y + 5);
		for (let y = startY; y >= Math.max(0, startY - 20); y--) {
			const blockPos = new Vector3(Math.floor(x), y, Math.floor(z));
			const block = worldController.getBlock(blockPos);
			if (block && block.id !== 0 && block.id !== 18) {
				// 非空气且非水方块
				return y + 1; // 返回方块上表面
			}
		}
		// 找不到地面，尝试向上搜索
		for (let y = Math.floor(this.position.y); y <= Math.floor(this.position.y) + 10; y++) {
			const blockPos = new Vector3(Math.floor(x), y, Math.floor(z));
			const block = worldController.getBlock(blockPos);
			if (block && block.id !== 0 && block.id !== 18) {
				return y + 1;
			}
		}
		return this.position.y; // 实在找不到，保持当前高度
	}

	/**
	 * 检查是否在地面上
	 */
	private checkGrounded(): boolean {
		const groundHeight = this.getGroundHeight(this.position.x, this.position.z);
		return Math.abs(this.position.y - groundHeight) < this.GROUND_CHECK_DISTANCE;
	}

	/**
	 * 更新浸没度（基于生存战争的ImmersionFactor）
	 */
	private updateImmersionFactor(): void {
		const worldController = useWorldStore.getState().worldController;
		if (!worldController) {
			this.immersionFactor = 0;
			return;
		}

		const waterBlock = BlockType[BlockType.WaterBlock];
		let waterBlocks = 0;
		const checkPoints = 3; // 检查脚、腰、头

		for (let i = 0; i < checkPoints; i++) {
			const checkY = Math.floor(this.position.y + (i * 0.5));
			const block = worldController.getBlock(
				new Vector3(Math.floor(this.position.x), checkY, Math.floor(this.position.z))
			);
			if (block && block.blockType === waterBlock) {
				waterBlocks++;
			}
		}

		// 浸没度 = 水方块数 / 检查点数
		this.immersionFactor = waterBlocks / checkPoints;
	}

	/**
	 * 平滑旋转朝向
	 */
	private updateRotation(deltaTime: number): void {
		const deltaSeconds = deltaTime / 1000;
		const currentRotation = this.rootNode.rotation.y;
		
		// 计算角度差，处理-PI到PI的跨越
		let angleDiff = this.targetRotation - currentRotation;
		while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
		while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

		// 平滑插值
		if (Math.abs(angleDiff) > 0.01) {
			const rotationStep = this.ROTATION_SPEED * deltaSeconds;
			if (Math.abs(angleDiff) < rotationStep) {
				this.rootNode.rotation.y = this.targetRotation;
			} else {
				this.rootNode.rotation.y += Math.sign(angleDiff) * rotationStep;
			}
		}
	}

	/**
	 * 更新寻路系统
	 */
	private async updatePathfinding(deltaTime: number): Promise<void> {
		const moveVector = await this.pathfindingStateMachine.update(this.position, deltaTime);

		if (!moveVector) {
			// 检查是否卡住
			if (this.pathfindingStateMachine.isStuck()) {
				console.log(`[Animal ${this.type}] Stuck, stopping movement`);
				this.stopMoving();
				this.behaviorType = "Idle";
			}
			// 检查是否到达目标
			else if (this.pathfindingStateMachine.getState() === PathfindingState.Stopped) {
				this.isMoving = false;
			}
			return;
		}

		// 应用移动向量
		this.applyMovement(moveVector, deltaTime);
	}

	/**
	 * 应用移动向量（物理方式）
	 * 基于生存战争的ComponentLocomotion
	 */
	private applyMovement(moveVector: Vector3, deltaTime: number): void {
		const deltaSeconds = deltaTime / 1000;

		// 检查浸没度
		this.updateImmersionFactor();

		// 检查是否在地面上
		this.isGrounded = this.checkGrounded();

		// 重置移动状态
		this.isFlying = false;
		this.isSwimming = false;

		// 飞行模式（FlySpeed > 0 && FlyOrder）
		if (this.behaviorConfig.canFly && moveVector.lengthSquared() > 0) {
			// 飞行动物在空中或需要飞行时
			if (!this.isGrounded || this.immersionFactor < 1.0) {
				this.velocity.x = moveVector.x;
				this.velocity.z = moveVector.z;
				// 飞行时禁用重力
				this.isFlying = true;
				// 更新朝向
				this.targetRotation = Math.atan2(moveVector.x, moveVector.z);
				return;
			}
		}

		// 游泳模式（SwimSpeed > 0 && ImmersionFactor > 0.5）
		if (this.immersionFactor > 0.5) {
			if (this.config.canSwim || this.config.preferWater) {
				this.velocity.x = moveVector.x;
				this.velocity.z = moveVector.z;
				// 游泳时禁用重力（除非垂直移动）
				this.isSwimming = true;
				// 更新朝向
				if (moveVector.lengthSquared() > 0.01) {
					this.targetRotation = Math.atan2(moveVector.x, moveVector.z);
				}
				return;
			}
		}

		// 陆地移动模式
		if (!this.isGrounded) {
			// 在空中，应用重力
			this.velocity.y += this.GRAVITY * deltaSeconds;
		} else {
			// 在地面上，重置垂直速度并贴地
			this.velocity.y = 0;
			const groundHeight = this.getGroundHeight(this.position.x, this.position.z);
			this.position.y = groundHeight;
		}

		// 应用水平移动
		this.velocity.x = moveVector.x;
		this.velocity.z = moveVector.z;

		// 更新目标朝向
		if (moveVector.lengthSquared() > 0.01) {
			this.targetRotation = Math.atan2(moveVector.x, moveVector.z);
		}

		// 应用速度到位置
		this.position.x += this.velocity.x * deltaSeconds;
		this.position.y += this.velocity.y * deltaSeconds;
		this.position.z += this.velocity.z * deltaSeconds;

		// 确保不会掉到地下
		const groundHeight = this.getGroundHeight(this.position.x, this.position.z);
		if (this.position.y < groundHeight) {
			this.position.y = groundHeight;
			this.velocity.y = 0;
		}

		// 更新朝向
		this.updateRotation(deltaTime);
	}
}
