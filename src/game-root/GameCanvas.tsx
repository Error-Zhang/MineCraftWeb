import React, {RefObject, useEffect, useRef} from "react";
import { Game } from "./Game.ts";

const GameCanvas:React.FC<{canvasRef:RefObject<HTMLCanvasElement>}>= ({canvasRef}) => {

    const gameRef = useRef<Game | null>(null);

    useEffect(() => {
        gameRef.current = new Game(canvasRef.current!);

        return () => {
            // React严格模式下会执行两次以帮助检查副作用，但是这里执行dispose会卸载场景从而出现问题
            gameRef.current?.dispose();
        };
    }, []);

    return (
        <canvas
            id="game-canvas"
            ref={canvasRef}
        />
    );
};

export default GameCanvas;
