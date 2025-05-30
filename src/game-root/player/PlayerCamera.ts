import { FreeCamera, Mesh, Scene, Vector3 } from "@babylonjs/core";
import { PlayerInputSystem } from "@/game-root/player/PlayerInputSystem.ts";
import { playerEvents } from "@/game-root/core/events.ts";

// 基础相机类
export abstract class BasePlayerCamera {
	protected readonly scene: Scene;
	protected readonly camera: FreeCamera;
	protected readonly inputSystem: PlayerInputSystem;
	protected moveValue = { x: 0, y: 0, z: 0 };

	constructor(scene: Scene, canvas: HTMLCanvasElement) {
		this.scene = scene;
		this.camera = new FreeCamera("Camera", new Vector3(0, 0, 0), this.scene);
		this.camera.minZ = 0.1;
		this.camera.attachControl(canvas, true);
		this.inputSystem = PlayerInputSystem.Instance;

		this.initCamera();
		this.bindInput();

		this.scene.onBeforeRenderObservable.add(() => {
			this.update();
		});
	}

	public setChild(child: Mesh) {
		child.setParent(this.camera);
	}

	public setPosition(position: Vector3): void {
		this.camera.position = position;
		this.camera.setTarget(new Vector3(0, position.y, 0));
	}

	// 射线拾取选中的方块信息，排除玩家自身碰撞体
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

	protected update(): void {
		if (this.isMove()) {
			// 应用移动
			this.camera.position.addInPlace(
				new Vector3(this.moveValue.x, this.moveValue.y, this.moveValue.z)
			);
			// 重置移动值
			this.moveValue = { x: 0, y: 0, z: 0 };

			playerEvents.emit("move", this.camera.position);
		}
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
		const speedMultiplier = this.inputSystem.isActionActive("sprint") ? 2 : 1;
		const move = this.getMoveSpeed() * speedMultiplier;
		const dir = direction.normalize().scale(move);
		this.moveValue.x += dir.x;
		this.moveValue.z += dir.z;
	}

	private isMove(): boolean {
		const value = this.moveValue;
		return Math.abs(value.x) > 0.1 || Math.abs(value.y) > 0.1 || Math.abs(value.z) > 0.1;
	}
}

// 生存模式相机
export class SurvivalCamera extends BasePlayerCamera {
	private readonly jumpForce = 0.3;
	private isGrounded = true;
	private verticalVelocity = 0;
	private readonly gravity = 0.02;

	protected initCamera(): void {
		super.initCamera();
		this.camera.checkCollisions = true;
		this.camera.applyGravity = true;
	}

	protected bindInput(): void {
		super.bindInput();

		// 跳跃
		this.inputSystem.onActionStart("jump", () => {
			if (this.isGrounded) {
				this.verticalVelocity = this.jumpForce;
				this.isGrounded = false;
			}
		});
	}

	protected update(): void {
		// 应用重力
		if (!this.isGrounded) {
			this.verticalVelocity -= this.gravity;
			this.moveValue.y += this.verticalVelocity;

			// 检查是否着地
			if (this.camera.position.y <= 0) {
				this.camera.position.y = 0;
				this.verticalVelocity = 0;
				this.isGrounded = true;
			}
		}

		super.update();
	}

	protected getMoveSpeed(): number {
		return 0.1; // 生存模式移动速度
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
		return 0.3; // 创造模式移动速度更快
	}
}
