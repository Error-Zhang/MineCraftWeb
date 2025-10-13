import { Vector3 } from "@babylonjs/core";
import { useWorldStore } from "@/store";

/**
 * 飞行行为
 * 基于生存战争的ComponentFlyAroundBehavior
 */
export class FlyAroundBehavior {
	private angle: number = 0;
	private targetHeight: number = 0;
	private readonly MIN_FLY_HEIGHT = 3; // 最小飞行高度
	private readonly MAX_FLY_HEIGHT = 8; // 最大飞行高度
	private readonly FLY_DISTANCE = 10; // 飞行距离

	/**
	 * 生成下一个飞行目标
	 */
	public generateFlyTarget(currentPosition: Vector3): Vector3 {
		// 随机改变角度（80%概率小转向，20%概率大转向）
		const turnAmount = Math.random() < 0.2 
			? this.randomFloat(0.4, 0.6) 
			: -this.randomFloat(0.4, 0.6);
		
		this.angle = this.normalizeAngle(this.angle + turnAmount);

		// 计算水平方向
		const dirX = Math.cos(this.angle);
		const dirZ = Math.sin(this.angle);

		// 计算目标位置
		const targetX = currentPosition.x + dirX * this.FLY_DISTANCE;
		const targetZ = currentPosition.z + dirZ * this.FLY_DISTANCE;

		// 估算地面高度并设置飞行高度
		const groundHeight = this.estimateGroundHeight(targetX, targetZ, 8);
		const flyHeight = groundHeight + this.randomFloat(this.MIN_FLY_HEIGHT, this.MAX_FLY_HEIGHT);

		return new Vector3(targetX, flyHeight, targetZ);
	}

	/**
	 * 估算地面高度（采样周围区域）
	 */
	private estimateGroundHeight(x: number, z: number, radius: number): number {
		const worldController = useWorldStore.getState().worldController;
		if (!worldController) return 64; // 默认高度

		let maxHeight = 0;
		const samples = 15;

		for (let i = 0; i < samples; i++) {
			const sampleX = Math.floor(x) + this.randomInt(-radius, radius);
			const sampleZ = Math.floor(z) + this.randomInt(-radius, radius);

			// 向下搜索地面
			for (let y = 128; y >= 0; y--) {
				const block = worldController.getBlock(new Vector3(sampleX, y, sampleZ));
				if (block && block.id !== 0) {
					maxHeight = Math.max(maxHeight, y);
					break;
				}
			}
		}

		return maxHeight;
	}

	/**
	 * 标准化角度到 -PI 到 PI
	 */
	private normalizeAngle(angle: number): number {
		while (angle > Math.PI) angle -= Math.PI * 2;
		while (angle < -Math.PI) angle += Math.PI * 2;
		return angle;
	}

	/**
	 * 生成随机浮点数
	 */
	private randomFloat(min: number, max: number): number {
		return min + Math.random() * (max - min);
	}

	/**
	 * 生成随机整数
	 */
	private randomInt(min: number, max: number): number {
		return Math.floor(min + Math.random() * (max - min + 1));
	}
}
