import React, { RefObject, useEffect, useRef } from "react";
import { Game, GameOption } from "./Game.ts";

const GameCanvas: React.FC<{ canvasRef: RefObject<HTMLCanvasElement> }> = ({ canvasRef }) => {
	const gameRef = useRef<Game | null>(null);

	useEffect(() => {
		let option: GameOption = {
			seed: 568888,
			start: { x: 0, y: 2, z: 0 },
			bounds: {
				topLeft: {
					x: -1000,
					z: -1000,
				},
				bottomRight: {
					x: 1000,
					z: 1000,
				},
			},
			visualField: 64,
			gameMode: "creative",
			worldMode: "main",
		};
		const game = new Game(canvasRef.current!, option);
		game.start();
		gameRef.current = game;
		// 先设置监听UI传递过来的信息创建游戏
		return () => {
			// React严格模式下会执行两次以帮助检查副作用，但是这里执行dispose会卸载场景从而出现问题
			gameRef.current?.dispose();
		};
	}, []);

	return <canvas id="game-canvas" ref={canvasRef} />;
};

export default GameCanvas;
