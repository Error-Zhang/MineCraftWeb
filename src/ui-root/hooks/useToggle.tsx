import React, { useEffect } from "react";
import GameListener from "@/game-root/events/GameListener.ts";
import { gameEventBus } from "@/game-root/events/GameEventBus.ts";
import { GameEvents } from "@/game-root/events/GameEvents.ts";

type KeyBinding = string | string[];

/**
 * 监听键盘按键按下，触发回调
 * @param game
 * @param keys 监听的键或键数组（不区分大小写）
 * @param onToggle 触发回调函数
 * @param qkeys
 * @param onEscape
 */
export function useToggle(
	game: GameListener,
	keys: KeyBinding,
	onToggle: () => void,
	qkeys: KeyBinding,
	onEscape: () => void
) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const pressedKey = e.key.toLowerCase();

			// Convert keys to array if it's a string
			const keyArray = Array.isArray(keys) ? keys : [keys];
			const qkeyArray = Array.isArray(qkeys) ? qkeys : [qkeys];

			// Check if pressed key matches any of the target keys
			if (game.isInGame && keyArray.some(key => key.toLowerCase() === pressedKey)) {
				onToggle();
				game.togglePointerLock();
			} else if (!game.isInGame && qkeyArray.some(key => key.toLowerCase() === pressedKey)) {
				onEscape();
				game.togglePointerLock();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);
}

export function useToggleActive(
	game: GameListener,
	setIsActive: React.Dispatch<React.SetStateAction<boolean>>,
	keys: KeyBinding,
	onClose?: () => void
) {
	useToggle(
		game,
		keys,
		() => {
			setIsActive(true);
		},
		keys,
		() => {
			setIsActive(false);
			onClose?.();
		}
	);

	useEffect(() => {
		const cb = () => setIsActive(false);
		gameEventBus.on(GameEvents.hiddenPanel, cb);
		return () => gameEventBus.off(GameEvents.hiddenPanel, cb);
	}, [setIsActive]);
}
