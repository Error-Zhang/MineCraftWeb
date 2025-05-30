import { v4 } from "uuid";

const EPSILON = 1e-6;

class MathUtils {
	static generateGUID = v4;

	static decompressRLE(compressed: number[], decode?: (value: number) => number): number[] {
		if (!compressed || compressed.length === 0) {
			return [];
		}

		// 先计算解压后数组的长度
		let length = 0;
		for (let i = 1; i < compressed.length; i += 2) {
			length += compressed[i];
		}

		const result: number[] = new Array(length);
		let pos = 0;

		for (let i = 0; i < compressed.length; i += 2) {
			const value = compressed[i];
			const count = compressed[i + 1];
			for (let j = 0; j < count; j++) {
				result[pos++] = decode ? decode(value) : value;
			}
		}

		return result;
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
