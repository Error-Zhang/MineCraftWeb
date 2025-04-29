import { useEffect, useRef } from "react";
import GameListener from "@/game-root/events/GameListener.ts";

interface UseLongPressOptions {
	game: GameListener;
	onLongPress: () => void;
	delay?: number; // 触发长按的延迟，默认 300ms
	interval?: number; // 长按之后持续触发的间隔，默认 100ms
	button?: number; // 监听的鼠标按键，默认左键 (0)
	enabled?: boolean; // 是否启用监听
}

function useLongPress({
	onLongPress,
	game,
	delay = 300,
	interval = 100,
	button = 0,
	enabled = true,
}: UseLongPressOptions) {
	const pressStartTime = useRef(0);
	const intervalId = useRef<number | null>(null);

	useEffect(() => {
		if (!enabled) return;

		const handleMouseDown = (e: MouseEvent) => {
			if (e.button !== button) return;
			pressStartTime.current = Date.now();

			intervalId.current = window.setInterval(() => {
				const duration = Date.now() - pressStartTime.current;
				if (duration >= delay) {
					onLongPress();
				}
			}, interval);
		};

		const handleMouseUp = (e: MouseEvent) => {
			if (e.button !== button) return;
			if (intervalId.current !== null) {
				clearInterval(intervalId.current);
				intervalId.current = null;
			}
		};

		game.addEventListener("mousedown", handleMouseDown);
		game.addEventListener("mouseup", handleMouseUp);

		return () => {
			game.removeEventListener("mousedown", handleMouseDown);
			game.removeEventListener("mouseup", handleMouseUp);
			if (intervalId.current !== null) {
				clearInterval(intervalId.current);
				intervalId.current = null;
			}
		};
	}, []);
}

export default useLongPress;
