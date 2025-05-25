import React, { RefObject, useEffect, useRef } from "react";
import { Game } from "../game-root/Game.ts";
import { useEventBus } from "@/ui-root/hooks/useEventBus.tsx";

const GameCanvas: React.FC<{ canvasRef: RefObject<HTMLCanvasElement> }> = ({ canvasRef }) => {
	const gameRef = useRef<Game | null>(null);
	useEffect(() => {
		gameRef.current = new Game(canvasRef.current!);
	}, []);
	useEventBus("startGame", () => {
		gameRef.current!.start();
	});
	useEventBus("endGame", () => {
		gameRef.current!.dispose();
	});
	return <canvas id="game-canvas" ref={canvasRef} />;
};

export default GameCanvas;
