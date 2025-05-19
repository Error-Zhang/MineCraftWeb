import React, { RefObject, useRef } from "react";
import { Game, GameOption } from "./Game.ts";
import { GameEvents } from "@/game-root/events/GameEvents.ts";
import { useEventBus } from "@/ui-root/hooks/useEventBus.tsx";

const GameCanvas: React.FC<{ canvasRef: RefObject<HTMLCanvasElement> }> = ({ canvasRef }) => {
	const gameRef = useRef<Game | null>(null);
	useEventBus(GameEvents.startGame, () => {
		const option: GameOption = {
			seed: 568888,
			start: { x: -112, y: 2, z: -112 },
			bounds: {
				topLeft: { x: -1000, z: -1000 },
				bottomRight: { x: 1000, z: 1000 },
			},
			visualField: 64,
			gameMode: "creative",
			worldMode: "main",
		};
		const game = new Game(canvasRef.current!, option);
		game.start();
		gameRef.current = game;
	});

	useEventBus(GameEvents.leaveGame, () => {
		gameRef.current?.dispose();
	});

	return <canvas id="game-canvas" ref={canvasRef} />;
};

export default GameCanvas;
