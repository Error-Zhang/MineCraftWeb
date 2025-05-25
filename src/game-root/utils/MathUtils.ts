import { v4 } from "uuid";

const EPSILON = 1e-6;

class MathUtils {
	static generateGUID = v4;
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
