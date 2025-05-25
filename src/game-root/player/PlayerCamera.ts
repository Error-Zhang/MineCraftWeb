import { FreeCamera, Scene, Vector3 } from "@babylonjs/core";
import GameWindow from "@/game-root/core/GameWindow.ts";
import { usePlayerStore } from "@/store";

export class PlayerCamera {
	readonly speed: number = 0.3; // Minecraft 风格的移动速度
	private readonly scene: Scene;
	private readonly vector: { x: number; y: number; z: number };
	private readonly camera: FreeCamera;
	private moveValue = { x: 0, y: 0, z: 0 };
	private moveFlags = {
		forward: false,
		back: false,
		left: false,
		right: false,
		up: false,
		down: false,
		sprint: false,
	};

	constructor(scene: Scene, canvas: HTMLCanvasElement) {
		this.scene = scene;
		this.vector = usePlayerStore.getState().position;
		this.camera = new FreeCamera(
			"Camera",
			new Vector3(this.vector.x, this.vector.y, this.vector.z),
			this.scene
		);
		this.camera.minZ = 0.1;
		this.camera.checkCollisions = true;
		this.camera.applyGravity = true;
		this.camera.inertia = 0.6;
		this.camera.speed = 0.6;
		this.camera.setTarget(new Vector3(0, this.vector.y, 0));
		this.camera.attachControl(canvas, true);
		this.bindInput(GameWindow.getInstance(canvas));
		this.scene.onBeforeRenderObservable.add(() => {
			this.update();
			if (Object.values(this.moveFlags).find(flag => flag)) {
				usePlayerStore.setState({ position: this.vector });
			}
		});
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

	private bindInput(gameWindow: GameWindow) {
		gameWindow.addEventListener("keydown", (e: KeyboardEvent) => {
			this.setFlag(e.code, true);
		});
		gameWindow.addEventListener("keyup", (e: KeyboardEvent) => {
			this.setFlag(e.code, false);
		});
	}

	private update(): void {
		// 计算移动速度倍率
		const speedMultiplier = this.moveFlags.sprint ? 2 : 1;

		// 水平移动
		if (this.moveFlags.forward) this.moveFront();
		if (this.moveFlags.left) this.moveLeft();
		if (this.moveFlags.back) this.moveBack();
		if (this.moveFlags.right) this.moveRight();

		// 垂直移动
		if (this.moveFlags.up) {
			this.moveValue.y += this.speed * speedMultiplier;
		}
		if (this.moveFlags.down) {
			this.moveValue.y -= this.speed * speedMultiplier;
		}

		// 应用移动
		this.camera.position.addInPlace(
			new Vector3(this.moveValue.x, this.moveValue.y, this.moveValue.z)
		);

		// 更新位置状态
		this.vector.x = this.camera.position.x;
		this.vector.y = this.camera.position.y;
		this.vector.z = this.camera.position.z;

		// 重置移动值
		this.moveValue = { x: 0, y: 0, z: 0 };
	}

	private moveFront(): void {
		this.moveByDirection(this.camera.getDirection(Vector3.Forward()));
	}

	private moveBack(): void {
		this.moveByDirection(this.camera.getDirection(Vector3.Forward().scale(-1)));
	}

	private moveLeft(): void {
		this.moveByDirection(this.camera.getDirection(Vector3.Right().scale(-1)));
	}

	private moveRight(): void {
		this.moveByDirection(this.camera.getDirection(Vector3.Right()));
	}

	private moveByDirection(direction: Vector3): void {
		const speedMultiplier = this.moveFlags.sprint ? 2 : 1;
		const move = this.speed * speedMultiplier;
		const dir = direction.normalize().scale(move);
		this.moveValue.x += dir.x;
		this.moveValue.z += dir.z;
	}

	private setFlag(code: string, state: boolean) {
		switch (code) {
			case "KeyW":
				this.moveFlags.forward = state;
				break;
			case "KeyA":
				this.moveFlags.left = state;
				break;
			case "KeyS":
				this.moveFlags.back = state;
				break;
			case "KeyD":
				this.moveFlags.right = state;
				break;
			case "Space":
				this.moveFlags.up = state;
				break;
			case "ShiftLeft":
				this.moveFlags.down = state;
				break;
			case "ControlLeft":
				this.moveFlags.sprint = state;
				break;
		}
	}
}
