import { Ray, Scene, Vector3 } from "@babylonjs/core";
import { PhysicsConfig } from "@/game-root/config/PhysicsConfig";

/**
 * 玩家物理系统
 * 参考生存战争的物理实现，提供更真实的重力、跳跃和碰撞处理
 */
export class PlayerPhysics {
	// ==================== 物理状态 ====================

	/** 垂直速度 (方块/秒) */
	private velocityY: number = 0;

	/** 是否在地面上 */
	private isGrounded: boolean = false;

	/** 是否正在跳跃 */
	private isJumping: boolean = false;

	/** 跳跃按键是否被按住 */
	private jumpKeyHeld: boolean = false;

	/** 跳跃持续时间（用于可变跳跃高度） */
	private jumpTime: number = 0;

	/** 场景引用 */
	private scene: Scene;

	/** 玩家位置引用 */
	private position: Vector3;

	constructor(scene: Scene, position: Vector3) {
		this.scene = scene;
		this.position = position;
	}

	/**
	 * 更新物理状态
	 * @param deltaTime 帧间隔时间（秒）
	 * @returns 垂直方向的位移
	 */
	public update(deltaTime: number): number {
		// 1. 检测地面
		this.checkGround();

		// 2. 应用重力
		this.applyGravity(deltaTime);

		// 3. 处理跳跃
		this.updateJump(deltaTime);

		// 4. 限制最大下落速度
		this.clampFallSpeed();

		// 5. 计算垂直位移
		const displacement = this.velocityY * deltaTime;

		// 6. 应用摩擦力
		this.applyFriction();

		return displacement;
	}

	/**
	 * 尝试跳跃
	 * @returns 是否成功跳跃
	 */
	public tryJump(): boolean {
		if (this.isGrounded && !this.isJumping) {
			this.velocityY = PhysicsConfig.PLAYER.jumpVelocity;
			this.isJumping = true;
			this.isGrounded = false;
			this.jumpTime = 0;
			this.jumpKeyHeld = true;
			return true;
		}
		return false;
	}

	/**
	 * 释放跳跃键
	 */
	public releaseJump(): void {
		this.jumpKeyHeld = false;
	}

	/**
	 * 检测是否可以爬上台阶
	 * @param horizontalDirection 水平移动方向
	 * @returns 台阶高度，如果无法爬上则返回0
	 */
	public checkStepUp(horizontalDirection: Vector3): number {
		if (!this.isGrounded) return 0;

		// 从当前位置向前检测
		const origin = this.position.clone();
		const direction = horizontalDirection.normalize();

		// 检测多个高度
		for (let height = 0.1; height <= PhysicsConfig.PLAYER.stepHeight; height += 0.1) {
			const checkPos = origin.add(direction.scale(0.5));
			checkPos.y += height;

			const ray = new Ray(checkPos, direction, 0.5);
			const pick = this.scene.pickWithRay(ray, mesh => mesh.isPickable && mesh.checkCollisions);

			// 如果这个高度没有碰撞，说明可以爬上
			if (!pick?.hit) {
				// 再检测这个高度是否有地面
				const groundRay = new Ray(checkPos, Vector3.Down(), height + 0.2);
				const groundPick = this.scene.pickWithRay(
					groundRay,
					mesh => mesh.isPickable && mesh.checkCollisions
				);

				if (groundPick?.hit) {
					return height;
				}
			}
		}

		return 0;
	}

	/**
	 * 是否在地面上
	 */
	public getIsGrounded(): boolean {
		return this.isGrounded;
	}

	/**
	 * 强制设置地面状态（用于传送等情况）
	 */
	public setGrounded(grounded: boolean): void {
		this.isGrounded = grounded;
		if (grounded) {
			this.velocityY = 0;
			this.isJumping = false;
		}
	}

	/**
	 * 重置物理状态
	 */
	public reset(): void {
		this.velocityY = 0;
		this.isGrounded = false;
		this.isJumping = false;
		this.jumpKeyHeld = false;
		this.jumpTime = 0;
	}

	/**
	 * 获取物理信息（用于调试）
	 */
	public getDebugInfo(): {
		velocityY: number;
		isGrounded: boolean;
		isJumping: boolean;
		jumpTime: number;
	} {
		return {
			velocityY: this.velocityY,
			isGrounded: this.isGrounded,
			isJumping: this.isJumping,
			jumpTime: this.jumpTime,
		};
	}

	/**
	 * 检测是否在地面上
	 */
	private checkGround(): void {
		if (this.isJumping) return;
		const origin = this.position.clone();

		const checkDist = PhysicsConfig.PLAYER.groundCheckDistance;
		const ray = new Ray(origin, Vector3.Down(), checkDist);
		const pick = this.scene.pickWithRay(ray, mesh => mesh.isPickable && mesh.checkCollisions);

		const wasGrounded = this.isGrounded;
		this.isGrounded = !!(pick?.hit && pick.distance <= checkDist);

		// 着陆时重置垂直速度
		if (this.isGrounded && !wasGrounded) {
			this.onLanded();
		}
	}

	/**
	 * 应用重力
	 */
	private applyGravity(deltaTime: number): void {
		if (!this.isGrounded) {
			// 空中时应用重力加速度
			this.velocityY -= PhysicsConfig.PLAYER.gravity * deltaTime;
		} else if (!this.isJumping) {
			// 在地面上且不跳跃时，保持轻微的向下速度以保持贴地
			this.velocityY = -0.5;
		}
	}

	/**
	 * 更新跳跃状态
	 */
	private updateJump(deltaTime: number): void {
		if (this.isJumping) {
			this.jumpTime += deltaTime;

			// 如果松开跳跃键或超过最大跳跃时间，结束跳跃加速
			if (!this.jumpKeyHeld || this.jumpTime >= PhysicsConfig.PLAYER.maxJumpTime) {
				this.isJumping = false;
			}
		}
	}

	/**
	 * 限制最大下落速度
	 */
	private clampFallSpeed(): void {
		if (this.velocityY < -PhysicsConfig.PLAYER.maxFallSpeed) {
			this.velocityY = -PhysicsConfig.PLAYER.maxFallSpeed;
		}
	}

	/**
	 * 应用摩擦力
	 */
	private applyFriction(): void {
		if (this.isGrounded) {
			// 地面摩擦力更大
			this.velocityY *= PhysicsConfig.PLAYER.groundFriction;
		} else {
			// 空中摩擦力较小
			this.velocityY *= PhysicsConfig.PLAYER.airFriction;
		}
	}

	/**
	 * 着陆回调
	 */
	private onLanded(): void {
		// 着陆时重置垂直速度
		if (this.velocityY < 0) {
			this.velocityY = 0;
		}
		this.isJumping = false;
		this.jumpTime = 0;
	}
}
