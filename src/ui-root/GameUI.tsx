import React, { RefObject, useState } from "react";
import GameUIWrapper from "./components/GameUIWrapper.tsx";
import StartScreen from "@/ui-root/views/start-screen";
import { useEventBus } from "@/ui-root/hooks/useEventBus.tsx";

const GameUI: React.FC<{ canvasRef: RefObject<HTMLCanvasElement> }> = ({ canvasRef }) => {
	const [startGame, setStartGame] = useState(false);
	useEventBus("startGame", () => {
		setStartGame(true);
	});
	useEventBus("endGame", () => {
		setStartGame(false);
	});
	return <GameUIWrapper canvasRef={canvasRef}>{<StartScreen hidden={startGame} />}</GameUIWrapper>;
};

export default GameUI;
