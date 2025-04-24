import React, {RefObject, useEffect, useRef, useState} from "react";
import {generateAllBlockIcons} from "@/game-root/block-icon-module/generator.ts";
import GameEventManager from "@/game-root/utils/GameEventManager.ts";
import CraftingTablePanel from "./views/crafting-panel";
import HotBar from "./views/hotbar";
import GameUIWrapper from "@/ui-root/components/GameUIWrapper.tsx";
import {BlockIconStore} from "@/game-root/block-icon-module/store.ts";
import blockFactory from "@/game-root/utils/BlockFactory.ts";
import CatalogPanel from "@/ui-root/views/catalog-panel";

const GameUI: React.FC<{ canvasRef: RefObject<HTMLCanvasElement> }> = ({canvasRef}) => {
    const [isRender, setIsRender] = useState(false);
    const [blockIconMap, setBlockIconMap] = useState<Record<string, string>>({});
    const gameEventManagerRef = useRef<GameEventManager>();

    useEffect(() => {
        gameEventManagerRef.current = new GameEventManager(canvasRef.current!);
        generateAllBlockIcons().then(_ => {
            const registerBlocks = blockFactory.getAllRegisterBlocks();
            BlockIconStore.getIconUrls(registerBlocks).then(record => {
                setBlockIconMap(record);
                setIsRender(true);
            })
        });
        return () => {
            gameEventManagerRef.current?.destroy();
        }
    }, []);

    return isRender && <GameUIWrapper canvasRef={canvasRef}>
        <HotBar gameEventManager={gameEventManagerRef.current!} blockIconMap={blockIconMap}/>
        <CraftingTablePanel/>
        <CatalogPanel gameEventManager={gameEventManagerRef.current!} blockIconMap={blockIconMap}/>
    </GameUIWrapper>
}

export default GameUI;