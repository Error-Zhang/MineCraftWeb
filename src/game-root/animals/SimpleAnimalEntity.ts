import { AbstractMesh, Scene, TransformNode, Vector3 } from "@babylonjs/core";
import { AnimalMovementConfig, AnimalPathfinder, DEFAULT_ANIMAL_CONFIGS } from "./pathfinding/AnimalPathfinder";
import AnimalModelCache from "./AnimalModelCache";
import { generateTargetPosition, getAnimalBehaviorConfig, type IdleBehaviorConfig } from "./AnimalBehaviorConfig";
import { useWorldStore } from "@/store";

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
	private path: Vector3[] = [];
	private currentPathIndex: number = 0;
	private config: AnimalMovementConfig;
	private behaviorConfig: IdleBehaviorConfig;
	private isMoving: boolean = false;
	private moveSpeed: number = 0.08;

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
	public update(deltaTime: number): void {
		if (!this.isOwned) return; // 非拥有者不更新AI

		// 更新行为
		this.updateBehavior(deltaTime);

		// 更新移动
		if (this.isMoving && this.path.length > 0) {
			this.updateMovement(deltaTime);
		}

		// 更新位置
		this.rootNode.position.copyFrom(this.position);
	}

	/**
	 * 移动到目标位置
	 */
	public moveTo(target: Vector3): void {
		this.targetPosition = target;

		// 使用寻路系统计算路径
		const distance = Vector3.Distance(this.position, target);

		if (distance < 10) {
			// 短距离使用简单寻路
			this.path = AnimalPathfinder.findSimplePath(this.position, target, this.config) || [];
		} else {
			// 长距离使用A*
			this.path = AnimalPathfinder.findPath(this.position, target, this.config) || [];
		}

		this.currentPathIndex = 0;
		this.isMoving = this.path.length > 0;
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
		this.path = [];
		this.targetPosition = null;
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
			}
		}
	}

	/**
	 * 开始随机行走
	 */
	private startRandomWalk(): void {
		// 使用行为配置生成目标位置
		const target = generateTargetPosition(this.position, this.behaviorConfig);

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
	 * 更新移动（物理方式）
	 */
	private updateMovement(deltaTime: number): void {
		const deltaSeconds = deltaTime / 1000;

		// 检查是否在地面上
		this.isGrounded = this.checkGrounded();

		// 应用重力（飞行动物也需要轻微的重力，除非在空中悬停）
		if (!this.isGrounded) {
			if (this.behaviorConfig.canFly) {
				// 飞行动物有轻微的重力，但会自动调整高度
				this.velocity.y += this.GRAVITY * deltaSeconds * 0.3;
			} else {
				// 陆地动物正常重力
				this.velocity.y += this.GRAVITY * deltaSeconds;
			}
		} else {
			// 在地面上，重置垂直速度并贴地
			this.velocity.y = 0;
			const groundHeight = this.getGroundHeight(this.position.x, this.position.z);
			this.position.y = groundHeight;
		}

		// 水平移动
		if (this.isMoving && this.currentPathIndex < this.path.length) {
			const targetWaypoint = this.path[this.currentPathIndex];
			const horizontalDirection = new Vector3(
				targetWaypoint.x - this.position.x,
				0,
				targetWaypoint.z - this.position.z
			);
			const horizontalDistance = horizontalDirection.length();

			if (horizontalDistance < 0.2) {
				// 到达当前路径点
				this.currentPathIndex++;
				if (this.currentPathIndex >= this.path.length) {
					this.isMoving = false;
					this.velocity.x = 0;
					this.velocity.z = 0;
				}
			} else {
				// 计算移动速度
				const normalizedDirection = horizontalDirection.normalize();
				const speed = this.moveSpeed;
				
				this.velocity.x = normalizedDirection.x * speed;
				this.velocity.z = normalizedDirection.z * speed;

				// 更新目标朝向
				this.targetRotation = Math.atan2(normalizedDirection.x, normalizedDirection.z);
			}
		} else {
			// 不移动时，清零水平速度
			this.velocity.x = 0;
			this.velocity.z = 0;
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
