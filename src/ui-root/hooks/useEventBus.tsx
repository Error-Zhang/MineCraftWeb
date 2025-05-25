import { useEffect } from "react";
import { gameEvents } from "@/game-root/events";

/**
 * 自动注册并在卸载时移除事件监听器
 * @param eventBus 事件总线对象
 * @param eventName 事件名
 * @param handler 事件处理函数
 */
export function useEventBus(eventName: string, handler: (...args: any[]) => void) {
	useEffect(() => {
		gameEvents.on(eventName, handler);
		return () => {
			gameEvents.off(eventName, handler);
		};
	}, []);
}
