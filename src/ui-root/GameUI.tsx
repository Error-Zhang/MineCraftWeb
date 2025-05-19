import React, { createContext, RefObject, useLayoutEffect, useRef, useState } from "react";
import GameWindow from "@/game-root/events/GameWindow.ts";

import GameUIWrapper from "./components/GameUIWrapper.tsx";
import HotBar from "./views/hotbar";
import Catalog from "./views/catalog";
import { HandSlotManager } from "@/ui-root/components/slot/HandSlotManager.tsx";
import Bag from "@/ui-root/views/bag";
import StartScreen from "@/ui-root/views/start-screen";
import { useEventBus } from "@/ui-root/hooks/useEventBus.tsx";
import { GameEvents } from "@/game-root/events/GameEvents.ts";

export interface GameProps {
	game: GameWindow;
}

export const GameContext = createContext<GameProps>({} as GameProps);

const GameUI: React.FC<{ canvasRef: RefObject<HTMLCanvasElement> }> = ({ canvasRef }) => {
	const game = useRef<GameWindow>();
	const [loadingGame, setLoadingGame] = useState(false);
	useEventBus(GameEvents.startGame, () => {
		setLoadingGame(true);
	});
	useLayoutEffect(() => {
		game.current = GameWindow.getInstance(canvasRef.current!);
	}, []);

	return (
		<GameUIWrapper canvasRef={canvasRef}>
			{!loadingGame && <StartScreen />}
			{loadingGame && (
				<>
					<GameContext.Provider
						value={{
							game: game.current!,
						}}
					>
						<HotBar />
						<Catalog />
						<Bag rows={4} columns={6} />
					</GameContext.Provider>
					<HandSlotManager />
				</>
			)}
		</GameUIWrapper>
	);
};

export default GameUI;
