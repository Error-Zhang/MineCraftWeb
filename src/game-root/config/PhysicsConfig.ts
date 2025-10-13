/**
 * 物理配置
 * 基于生存战争的物理参数，提供可调整的物理常量
 */
export class PhysicsConfig {
	/**
	 * 玩家物理配置
	 */
	public static readonly PLAYER = {
		// ==================== 重力系统 ====================

		/** 重力加速度 (方块/秒²) */
		gravity: 10.0,

		/** 最大下落速度 (方块/秒) */
		maxFallSpeed: 20.0,

		// ==================== 跳跃系统 ====================

		/** 跳跃初速度 (方块/秒) */
		jumpVelocity: 4.5,

		/** 最大跳跃持续时间（秒）- 按住跳跃键可以跳更高 */
		maxJumpTime: 0.2,

		// ==================== 移动系统 ====================

		/** 地面移动速度 */
		groundMoveSpeed: 0.05,

		/** 空中移动速度倍率 */
		airMoveSpeedMultiplier: 0.7,

		/** 疾跑速度倍率 */
		sprintSpeedMultiplier: 1.3,

		/** 潜行速度倍率 */
		sneakSpeedMultiplier: 0.3,

		// ==================== 摩擦力 ====================

		/** 地面摩擦力 (0-1) */
		groundFriction: 0.85,

		/** 空中摩擦力 (0-1) */
		airFriction: 0.98,

		// ==================== 碰撞检测 ====================

		/** 地面检测距离 */
		groundCheckDistance: 2,

		/** 可自动爬上的台阶高度 */
		stepHeight: 0.5,

		/** 碰撞体宽度 */
		collisionWidth: 0.8,

		/** 碰撞体高度 */
		collisionHeight: 1.8,

		/** 碰撞体深度 */
		collisionDepth: 0.8,

		// ==================== 相机设置 ====================

		/** 相机碰撞椭球体 */
		cameraEllipsoid: {
			x: 0.3,
			y: 0.9,
			z: 0.3,
		},

		/** 相机惯性 */
		cameraInertia: 0.6,

		/** 相机速度 */
		cameraSpeed: 0.6,
	};

	/**
	 * 调试模式
	 */
	public static DEBUG = {
		/** 显示物理调试信息 */
		showPhysicsInfo: false,

		/** 显示碰撞体 */
		showCollisionBox: false,

		/** 显示地面检测射线 */
		showGroundRay: false,
	};
}

// 导出便捷访问
export const PlayerPhysicsConfig = PhysicsConfig.PLAYER;
