import React, { useEffect } from "react";
import GameWindow from "@/game-root/core/GameWindow.ts";

type KeyBinding = string | string[];

/**
 * 监听键盘按键按下，触发回调
 * @param keys 监听的键或键数组（不区分大小写）
 * @param onToggle 触发回调函数
 * @param qkeys
 * @param onEscape
 * @param isToggle
 */
export function useToggle(
	keys: KeyBinding,
	onToggle: () => void,
	qkeys: KeyBinding,
	onEscape: () => void,
	isToggle?: () => boolean
) {
	useEffect(() => {
		if (isToggle && !isToggle()) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			const pressedKey = e.key.toLowerCase();

			const keyArray = Array.isArray(keys) ? keys : [keys];
			const qkeyArray = Array.isArray(qkeys) ? qkeys : [qkeys];
			const game = GameWindow.Instance;

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
	setIsActive: React.Dispatch<React.SetStateAction<boolean>>,
	keys: KeyBinding,
	isToggle?: () => boolean
) {
	useToggle(
		keys,
		() => {
			setIsActive(true);
		},
		keys,
		() => {
			setIsActive(false);
		},
		isToggle
	);
}
