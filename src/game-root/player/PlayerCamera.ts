import { FreeCamera, Scene, Vector3 } from "@babylonjs/core";
import { PlayerInputSystem } from "@/game-root/player/PlayerInputSystem.ts";
import { playerEvents } from "@/game-root/core/events.ts";
import { PlayerPhysics } from "@/game-root/player/PlayerPhysics.ts";

// 基础相机类
export abstract class BasePlayerCamera {
	protected readonly scene: Scene;
	protected readonly camera: FreeCamera;
	protected readonly inputSystem: PlayerInputSystem;
	protected moveValue = { x: 0, y: 0, z: 0 };

	protected moveSpeed: number = 0.05;
	private cameraState = {
		lastPosition: new Vector3(),
		lastYaw: 0,
		lastPitch: 0,
	};

	constructor(scene: Scene, canvas: HTMLCanvasElement) {
		this.scene = scene;
		this.camera = new FreeCamera("Camera", new Vector3(0, 0, 0), this.scene);
		this.camera.minZ = 0.1;
		this.camera.attachControl(canvas, true);
		this.inputSystem = PlayerInputSystem.Instance;

		scene.gravity = new Vector3(0, -9.81 / 60, 0);
		scene.collisionsEnabled = true;

		this.camera.ellipsoid = new Vector3(0.4, 0.9, 0.2); // 碰撞半径
		this.camera.ellipsoidOffset = new Vector3(0, 0, 0); // 默认在顶部，向下偏移

		this.initCamera();
		this.bindInput();
	}

	public dispose() {
		this.camera.detachControl();
		this.camera.dispose();
	}

	public getYawPitch() {
		return [this.camera.rotation.y, this.camera.rotation.x] as const;
	}

	public detectCameraChanges() {
		const currentPosition = this.camera.position;
		const [yaw, pitch] = this.getYawPitch();
		let value = 0.01;
		const moved = !currentPosition.equalsWithEpsilon(this.cameraState.lastPosition, value);
		const turned =
			Math.abs(yaw - this.cameraState.lastYaw) > value ||
			Math.abs(pitch - this.cameraState.lastPitch) > value;

		if (moved) {
			this.cameraState.lastPosition.copyFrom(currentPosition);
			playerEvents.emit("playerTranslated", {
				x: currentPosition.x,
				y: currentPosition.y,
				z: currentPosition.z,
			});
		}
		if (turned) {
			this.cameraState.lastYaw = yaw;
			this.cameraState.lastPitch = pitch;
			playerEvents.emit("playerRotated", {
				yaw,
				pitch,
			});
		}
	}

	public setPosition(x: number, y: number, z: number): void {
		this.camera.position.set(x, y, z);
		this.camera.setTarget(new Vector3(0, y, 0));
	}

	// 射线拾取选中的方块信息
	public getPickInfo(maxPlaceDistance: number) {
		const ray = this.camera!.getForwardRay();
		const pick = this.scene.pickWithRay(ray, mesh => {
			return mesh.isPickable;
		});

		if (pick?.hit && pick.pickedPoint && pick.distance <= maxPlaceDistance) {
			return pick;
		}

		return null;
	}

	public update(dt: number): void {
		this.camera.cameraDirection.addInPlace(
			new Vector3(this.moveValue.x, this.moveValue.y, this.moveValue.z)
		);
		// 重置移动值
		this.moveValue = { x: 0, y: 0, z: 0 };
		this.detectCameraChanges();
	}

	protected initCamera(): void {
		this.camera.inertia = 0.6;
		this.camera.speed = 0.6;
	}

	protected bindInput(): void {
		// 移动控制
		this.inputSystem.onActionUpdate("moveForward", () => this.moveFront());
		this.inputSystem.onActionUpdate("moveBackward", () => this.moveBack());
		this.inputSystem.onActionUpdate("moveLeft", () => this.moveLeft());
		this.inputSystem.onActionUpdate("moveRight", () => this.moveRight());
	}

	protected abstract getMoveSpeed(): number;

	protected moveFront(): void {
		this.moveByDirection(this.camera.getDirection(Vector3.Forward()));
	}

	protected moveBack(): void {
		this.moveByDirection(this.camera.getDirection(Vector3.Forward().scale(-1)));
	}

	protected moveLeft(): void {
		this.moveByDirection(this.camera.getDirection(Vector3.Right().scale(-1)));
	}

	protected moveRight(): void {
		this.moveByDirection(this.camera.getDirection(Vector3.Right()));
	}

	protected moveByDirection(direction: Vector3): void {
		const speedMultiplier = this.inputSystem.isActionActive("sprint") ? 1.25 : 1;
		const move = this.getMoveSpeed() * speedMultiplier;
		// 只保留水平方向的移动，忽略垂直分量
		direction.y = 0;
		const dir = direction.normalize().scale(move);
		this.moveValue.x += dir.x;
		this.moveValue.z += dir.z;
	}
}

// 生存模式相机（使用改进的物理系统）
export class SurvivalCamera extends BasePlayerCamera {
	/** 物理系统 */
	private physics: PlayerPhysics;

	/** 移动速度倍率（跳跃时减速） */
	private moveSpeedMultiplier: number = 1.0;

	/** 上一帧的水平移动方向 */
	private lastMoveDirection: Vector3 = Vector3.Zero();

	constructor(scene: Scene, canvas: HTMLCanvasElement) {
		super(scene, canvas);
		this.physics = new PlayerPhysics(scene, this.camera.position);
	}

	public override update(dt: number): void {
		// 转换dt从毫秒到秒
		const deltaTime = dt / 1000;

		// 1. 更新物理系统，获取垂直位移
		const verticalDisplacement = this.physics.update(deltaTime);

		// 2. 应用垂直位移
		this.moveValue.y = verticalDisplacement;

		// 3. 处理台阶爬升
		if (this.physics.getIsGrounded() && this.lastMoveDirection.length() > 0) {
			const stepHeight = this.physics.checkStepUp(this.lastMoveDirection);
			if (stepHeight > 0) {
				// 可以爬上台阶，直接提升高度
				this.moveValue.y += stepHeight;
			}
		}

		// 4. 调整移动速度（跳跃/下落时减速）
		if (!this.physics.getIsGrounded()) {
			this.moveSpeedMultiplier = 0.7; // 空中移动减速
		} else {
			this.moveSpeedMultiplier = 1.0; // 地面正常速度
		}

		// 5. 调用父类更新
		super.update(dt);

		// 6. 重置水平移动方向
		this.lastMoveDirection = Vector3.Zero();
	}

	/**
	 * 设置位置（重写以更新物理系统）
	 */
	public override setPosition(x: number, y: number, z: number): void {
		super.setPosition(x, y, z);
		this.physics.setGrounded(false); // 传送后需要重新检测地面
	}

	protected initCamera(): void {
		super.initCamera();
		// 禁用Babylon自带的重力和碰撞，使用自定义物理系统
		this.camera.checkCollisions = true;
		this.camera.applyGravity = false; // 使用自定义重力

		// 调整碰撞体大小（更符合Minecraft）
		this.camera.ellipsoid = new Vector3(0.3, 0.9, 0.3);
		this.camera.ellipsoidOffset = new Vector3(0, 0, 0);
	}

	protected bindInput(): void {
		super.bindInput();

		// 跳跃开始
		this.inputSystem.onActionStart("jump", () => {
			this.physics.tryJump();
		});

		// 跳跃释放（用于可变跳跃高度）
		this.inputSystem.onActionEnd("jump", () => {
			this.physics.releaseJump();
		});
	}

	protected getMoveSpeed(): number {
		return this.moveSpeed * this.moveSpeedMultiplier;
	}

	protected override moveByDirection(direction: Vector3): void {
		// 记录移动方向用于台阶检测
		this.lastMoveDirection = direction.clone();
		this.lastMoveDirection.y = 0;

		// 调用父类方法
		super.moveByDirection(direction);
	}
}

// 创造模式相机
export class CreativeCamera extends BasePlayerCamera {
	protected initCamera(): void {
		super.initCamera();
		this.camera.checkCollisions = false;
		this.camera.applyGravity = false;
	}

	protected bindInput(): void {
		super.bindInput();

		// 垂直移动
		this.inputSystem.onActionUpdate("fly", () => {
			this.moveValue.y += this.getMoveSpeed();
		});

		this.inputSystem.onActionUpdate("sneak", () => {
			this.moveValue.y -= this.getMoveSpeed();
		});
	}

	protected getMoveSpeed(): number {
		return 0.1; // 创造模式移动速度更快
	}
}
