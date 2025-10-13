import { Vector3 } from "@babylonjs/core";
import { useWorldStore } from "@/store";
import BlockType from "@/game-root/block-definitions/BlockType.ts";

/**
 * 鱼类行为
 * 基于生存战争的ComponentFishOutOfWaterBehavior
 */
export class FishBehavior {
	private outOfWaterTime: number = 0;
	private readonly OUT_OF_WATER_THRESHOLD = 3000; // 3秒离开水就需要找水

	/**
	 * 检查是否离开水（浸没度 < 0.33）
	 */
	public isOutOfWater(immersionFactor: number): boolean {
		return immersionFactor < 0.33;
	}

	/**
	 * 更新离水时间
	 */
	public updateOutOfWaterTime(deltaTime: number, immersionFactor: number): boolean {
		if (this.isOutOfWater(immersionFactor)) {
			this.outOfWaterTime += deltaTime;
		} else {
			this.outOfWaterTime = 0;
		}

		// 返回是否需要紧急寻找水源
		return this.outOfWaterTime > this.OUT_OF_WATER_THRESHOLD;
	}

	/**
	 * 寻找水源目标
	 */
	public findWaterDestination(currentPosition: Vector3): Vector3 | null {
		const worldController = useWorldStore.getState().worldController;
		if (!worldController) return null;

		const waterBlock = BlockType[BlockType.WaterBlock];

		// 尝试8次找到水源
		for (let attempt = 0; attempt < 8; attempt++) {
			// 随机方向
			const dirX = (Math.random() - 0.5) * 2;
			const dirY = Math.random() * 0.4 - 0.2; // 轻微的上下偏移
			const dirZ = (Math.random() - 0.5) * 2;

			const direction = new Vector3(dirX, dirY, dirZ).normalize();
			const distance = this.randomFloat(8, 16);

			const targetPos = currentPosition.add(direction.scale(distance));

			// 射线检测，寻找水方块
			const rayResult = this.raycastToWater(currentPosition, targetPos);

			if (rayResult) {
				// 找到水源
				if (rayResult.distance > 4) {
					return rayResult.position;
				}
			}
		}

		return null;
	}

	/**
	 * 生成水中游动目标
	 */
	public generateSwimTarget(currentPosition: Vector3): Vector3 {
		// 随机方向（包括上下）
		const dirX = (Math.random() - 0.5) * 2;
		const dirY = Math.random() * 0.6 - 0.3; // -0.3 到 0.3
		const dirZ = (Math.random() - 0.5) * 2;

		const direction = new Vector3(dirX, dirY, dirZ).normalize();
		const distance = this.randomFloat(5, 10);

		return currentPosition.add(direction.scale(distance));
	}

	/**
	 * 射线检测寻找水方块
	 */
	private raycastToWater(
		start: Vector3,
		end: Vector3
	): { position: Vector3; distance: number } | null {
		const worldController = useWorldStore.getState().worldController;
		if (!worldController) return null;

		const waterBlock = BlockType[BlockType.WaterBlock];
		const direction = end.subtract(start);
		const distance = direction.length();
		const step = 0.5;
		const steps = Math.ceil(distance / step);

		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const checkPos = start.add(direction.scale(t));
			const block = worldController.getBlock(
				new Vector3(Math.floor(checkPos.x), Math.floor(checkPos.y), Math.floor(checkPos.z))
			);

			if (block && block.blockType === waterBlock) {
				return {
					position: checkPos,
					distance: distance * t,
				};
			}
		}

		return null;
	}

	/**
	 * 生成随机浮点数
	 */
	private randomFloat(min: number, max: number): number {
		return min + Math.random() * (max - min);
	}

	/**
	 * 重置离水时间
	 */
	public reset(): void {
		this.outOfWaterTime = 0;
	}
}
