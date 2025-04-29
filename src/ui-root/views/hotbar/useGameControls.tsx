import { Dispatch, SetStateAction, useEffect } from "react";
import { GameEvents } from "@/game-root/events/GameEvents";
import { GameMode } from "@/game-root/events/GameStore";
import GameListener from "@/game-root/events/GameListener.ts";
import { SlotType } from "@/ui-root/components/slot";
import useLongPress from "@/ui-root/views/hotbar/useLongPress.tsx";
import { gameEventBus } from "@/game-root/events/GameEventBus.ts";

interface UseGameControlsOptions {
	slots: SlotType[];
	setSlots: Dispatch<SetStateAction<SlotType[]>>;
	selectedIndex: number;
	setSelectedIndex: Dispatch<SetStateAction<number>>;
	game: GameListener;
	gameMode: GameMode;
}

export const HOTBAR_SIZE = 9;

export function useGameControls({
	game,
	slots,
	setSlots,
	selectedIndex,
	setSelectedIndex,
	gameMode,
}: UseGameControlsOptions) {
	// 键盘快捷键（1-9）
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			const num = parseInt(e.key);
			if (num >= 1 && num <= HOTBAR_SIZE) {
				setSelectedIndex(num - 1);
			}
		};
		game.addEventListener("keydown", handleKey);
		return () => game.removeEventListener("keydown", handleKey);
	}, [game, setSelectedIndex]);

	// 鼠标滚轮切换物品栏
	useEffect(() => {
		const handleWheel = (e: WheelEvent) => {
			setSelectedIndex(prev => (prev + (e.deltaY > 0 ? 1 : -1) + HOTBAR_SIZE) % HOTBAR_SIZE);
		};
		game.addEventListener("wheel", handleWheel);
		return () => game.removeEventListener("wheel", handleWheel);
	}, [game, setSelectedIndex]);

	// 鼠标右键放置方块
	useEffect(() => {
		const handlePointerDown = (e: MouseEvent) => {
			if (e.button === 2) {
				// 右键
				const slot = slots[selectedIndex];
				if (slot && slot.value > 0) {
					gameEventBus.emit(GameEvents.placeBlack, { blockType: slot.key }, () => {
						if (gameMode !== "creative") {
							--slot.value;
						}
						setSlots([...slots]);
					});
				}
			}
		};
		game.addEventListener("pointerdown", handlePointerDown);
		return () => game.removeEventListener("pointerdown", handlePointerDown);
	}, [game, slots, selectedIndex, setSlots, gameMode]);

	// 键盘 F 键交互
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === "f") {
				gameEventBus.emit(GameEvents.onInteract);
			}
		};
		game.addEventListener("keydown", handleKeyDown);
		return () => game.removeEventListener("keydown", handleKeyDown);
	}, [game]);

	// 鼠标左键长按破坏方块
	useLongPress({
		game,
		onLongPress: () => {
			gameEventBus.emit(GameEvents.destroyBlock);
		},
		delay: 300,
		interval: 300,
		button: 0, // 左键
		enabled: true,
	});
}
