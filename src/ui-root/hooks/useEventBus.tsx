import { useEffect } from "react";
import { gameEventBus } from "@/game-root/events/GameEventBus.ts";
import { GameEvents } from "@/game-root/events/GameEvents.ts";

/**
 * 自动注册并在卸载时移除事件监听器
 * @param eventBus 事件总线对象
 * @param eventName 事件名
 * @param handler 事件处理函数
 */
export function useEventBus(eventName: GameEvents, handler: (...args: any[]) => void) {
	useEffect(() => {
		gameEventBus.on(eventName, handler);
		return () => {
			gameEventBus.off(eventName, handler);
		};
	}, []);
}
