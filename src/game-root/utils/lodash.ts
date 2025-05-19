/**
 * 防抖函数：当连续调用时，只有在等待一段时间后才会执行最后一次调用
 * @param func 执行的函数
 * @param delay 防抖延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce(func: Function, delay: number) {
	let timeout: number | undefined;

	return function (...args: any[]) {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			func(...args);
		}, delay);
	};
}

/**
 * 节流函数：在指定的时间间隔内只执行一次
 * @param func 执行的函数
 * @param limit 节流时间间隔（毫秒）
 * @returns 节流后的函数
 */
export function throttle(func: Function, limit: number) {
	let lastFunc: number | null = null;
	let lastRan: number | null = null;

	return function (...args: any[]) {
		const now = Date.now();
		if (!lastRan || now - lastRan >= limit) {
			func(...args);
			lastRan = now;
		} else {
			if (lastFunc) clearTimeout(lastFunc);
			lastFunc = setTimeout(
				() => {
					func(...args);
					lastRan = Date.now();
				},
				limit - (now - lastRan)
			);
		}
	};
}

export function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}
