import React, { RefObject, useEffect, useRef } from "react";
import { Game } from "../game-root/Game.ts";
import { useGameStore } from "@/store";

const GameCanvas: React.FC<{ canvasRef: RefObject<HTMLCanvasElement> }> = ({ canvasRef }) => {
	const gameRef = useRef<Game | null>(null);
	useEffect(() => {
		gameRef.current = new Game(canvasRef.current!);
		useGameStore.subscribe((state, prevState) => {
			if (state.isGaming != prevState.isGaming) {
				state.isGaming ? gameRef.current!.start() : gameRef.current!.dispose();
			}
		});
		return () => {
			gameRef.current!.destroy();
		};
	}, []);
	return <canvas id="game-canvas" ref={canvasRef} />;
};

export default GameCanvas;
