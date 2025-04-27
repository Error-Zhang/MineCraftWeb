import React, {RefObject, useEffect, useRef} from "react";
import { Game } from "./Game.ts";
import GameStore from "@/game-root/events/GameStore.ts";

const GameCanvas:React.FC<{canvasRef:RefObject<HTMLCanvasElement>}>= ({canvasRef}) => {

    const gameRef = useRef<Game | null>(null);

    useEffect(() => {
        gameRef.current = new Game(canvasRef.current!);
        // 先设置监听UI传递过来的信息创建游戏
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
