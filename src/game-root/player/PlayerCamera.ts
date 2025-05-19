import { FreeCamera, Scene, Vector3 } from "@babylonjs/core";
import { GameOption } from "@/game-root/Game.ts";
import GameWindow from "@/game-root/events/GameWindow.ts";
import { gameEventBus } from "@/game-root/events/GameEventBus.ts";
import { GameEvents } from "@/game-root/events/GameEvents.ts";
import { Position } from "@/game-root/world/Chunk.ts";
import { throttle } from "@/game-root/utils/lodash.ts";

export class PlayerCamera {
	readonly speed: number = 0.1;
	private readonly option: GameOption;
	private readonly scene: Scene;
	private readonly vector: Position;
	private readonly camera: FreeCamera;
	private rate: number = 1;
	private moveValue: Position = { x: 0, y: 0, z: 0 };
	private maxJumpY: number = 0.25;
	private eachJumpY: number = 0.025;
	private eachFallY: number = 0.0075;
	private isJumpStart: boolean = false;
	private isJumpFall: boolean = false;
	private moveFlags = {
		forward: false,
		back: false,
		left: false,
		right: false,
		up: false,
		down: false,
	};
	private emitPlayerMove = throttle(() => {
		gameEventBus.emit(GameEvents.playerMove, { location: this.camera.position });
	}, 1000);

	constructor(scene: Scene, canvas: HTMLCanvasElement, option: GameOption) {
		this.option = option;
		this.scene = scene;
		this.vector = this.option.start;
		this.camera = new FreeCamera(
			"Camera",
			new Vector3(this.vector.x, this.vector.y, this.vector.z),
			this.scene
		);
		this.camera.minZ = 0.1;
		this.camera.checkCollisions = true;
		this.camera.applyGravity = true;
		this.camera.inertia = 0.6; // 禁用旋转惯性
		this.camera.speed = 0.6;
		this.camera.setTarget(new Vector3(0, this.vector.y, 0));
		this.camera.attachControl(canvas, true);
		this.bindInput(GameWindow.getInstance(canvas));
		this.scene.onBeforeRenderObservable.add(() => {
			this.update();
			if (Object.values(this.moveFlags).find(flag => flag)) {
				this.emitPlayerMove();
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
		if (this.moveFlags.forward) this.moveFront();
		if (this.moveFlags.left) this.moveLeft();
		if (this.moveFlags.back) this.moveBack();
		if (this.moveFlags.right) this.moveRight();
		if (this.moveFlags.up) this.moveUp();
		if (this.moveFlags.down) this.moveDown();
		this.handleJump();
	}

	private handleJump() {
		if (this.isJumpStart) {
			if (this.moveValue.y + this.eachJumpY < this.maxJumpY && !this.isJumpFall) {
				// 跳跃开始，上升
				if (this.moveValue.y < 0) {
					this.moveValue.y = 0;
				}
				this.moveValue.y += this.eachJumpY;
			} else {
				// 跳跃结束，开始下落
				this.isJumpFall = true;
			}
		}
		this.camera.cameraDirection.copyFromFloats(
			this.moveValue.x,
			this.isJumpStart ? this.moveValue.y : 0.05,
			this.moveValue.z
		);
		this.moveValue.x = 0;
		this.moveValue.z = 0;
		if (this.isJumpFall) {
			if (this.moveValue.y > -this.maxJumpY) {
				// 跳跃过程中不断下落
				this.moveValue.y -= this.eachFallY;
			} else {
				// 下落结束，可以开始下一次跳跃
				this.isJumpFall = false;
				this.isJumpStart = false;
			}
		}
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

	private moveUp(): void {
		this.isJumpStart = true;
	}

	private moveDown(): void {
		if (!this.isJumpStart) {
			this.moveValue.y -= 0.1;
		}
	}

	private moveByDirection(direction: Vector3): void {
		const move = this.speed * this.rate;
		const dir = direction.normalize().scale(move);
		const result = this.inBoundsXZ(dir.x, dir.z);
		this.moveValue.x += result.x;
		this.moveValue.z += result.z;
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
		}
	}

	// 空气墙
	private inBoundsXZ(x: number, z: number): { x: number; z: number } {
		let x0 = x,
			z0 = z;
		if (x < 0) {
			if (this.vector.x + x < this.option.bounds.topLeft.x) {
				x0 = 0;
			}
		} else {
			if (this.vector.x + x > this.option.bounds.bottomRight.x) {
				x0 = 0;
			}
		}
		if (z < 0) {
			if (this.vector.z + z < this.option.bounds.topLeft.z) {
				z0 = 0;
			}
		} else {
			if (this.vector.z + z > this.option.bounds.bottomRight.z) {
				z0 = 0;
			}
		}
		return { x: x0, z: z0 };
	}
}
