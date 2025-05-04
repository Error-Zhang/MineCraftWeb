import { v4 } from "uuid";

const EPSILON = 1e-6;

class MathUtils {
	static generateGUID = v4;

	// 线性插值函数
	static lerp(start: number, end: number, t: number): number {
		return start + (end - start) * t;
	}

	static saturate(value: number): number {
		return Math.min(1, Math.max(0, value));
	}

	static squish(v: number, zero: number, one: number): number {
		return this.saturate((v - zero) / (one - zero));
	}

	/**
	 * 带符号幂：保留符号，计算幂（通常用于带符号的噪声插值）
	 */
	static powSign(value: number, power: number): number {
		return Math.sign(value) * Math.pow(Math.abs(value), power);
	}

	/**
	 * 限制数值在指定范围内
	 */
	static clamp(value: number, min: number, max: number): number {
		return Math.max(min, Math.min(max, value));
	}

	/**
	 * 取两个数中较小的一个
	 */
	static min(a: number, b: number): number {
		return a < b ? a : b;
	}

	// 修正js中浮点数存在的偏差导致的问题
	static correct = (value: number, normal: number): number => {
		if (normal > 0) {
			return Math.floor(value + EPSILON) - 1;
		} else if (normal < 0) {
			return Math.floor(value - EPSILON) + 1;
		} else {
			return Math.floor(value); // 无需修正
		}
	};
}

export default MathUtils;
