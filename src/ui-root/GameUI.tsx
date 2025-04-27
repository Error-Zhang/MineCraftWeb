import React, {RefObject, useEffect, useRef, useState} from "react";
import {generateAllBlockIcons} from "@/block-icon/generator.ts";
import Game from "@/game-root/events/Game.ts";
import GameStore, {GameMode} from "@/game-root/events/GameStore.ts";
import {BlockIconStore} from "@/block-icon/store.ts";
import blockFactory from "@/blocks/core/BlockFactory.ts";

import GameUIWrapper from "./components/GameUIWrapper.tsx";
import CraftTable from "./views/craft-table";
import HotBar from "./views/hotbar";
import Catalog from "./views/catalog";

export interface GameProps {
    game: Game,
    blockIconMap: Record<string, string>,
    gameMode: GameMode,
}

const GameUI: React.FC<{ canvasRef: RefObject<HTMLCanvasElement> }> = ({canvasRef}) => {
    const [isRender, setIsRender] = useState(false);
    const [blockIconMap, setBlockIconMap] = useState<Record<string, string>>({});
    const game = useRef<Game>();
    const gameMode = useRef<GameMode>("creative");

    useEffect(() => {
        GameStore.set("gameMode", gameMode.current);
        game.current = new Game(canvasRef.current!);
        return () => {
            game.current?.destroy();
        }
    }, []);

    useEffect(() => {
        generateAllBlockIcons().then(_ => {
            const registerBlocks = blockFactory.getAllRegisterBlocks();
            BlockIconStore.getIconUrls(registerBlocks).then(record => {
                setBlockIconMap(record);
                setIsRender(true);
            })
        });
    }, []);

    return isRender && <GameUIWrapper canvasRef={canvasRef}>
        <HotBar gameMode={gameMode.current!} game={game.current!} blockIconMap={blockIconMap}/>
        <CraftTable gameMode={gameMode.current!} game={game.current!} blockIconMap={blockIconMap} />
        <Catalog gameMode={gameMode.current!} game={game.current!} blockIconMap={blockIconMap}/>
    </GameUIWrapper>
}

export default GameUI;