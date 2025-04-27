import React, {useEffect, useState} from "react";
import "./index.less";
import Slot, {SlotType} from "@/ui-root/components/slot";
import blockFactory from "@/blocks/core/BlockFactory.ts";
import {GameProps} from "@/ui-root/GameUI.tsx";
import gameEventBus from "@/game-root/events/GameEventBus.ts";
import {GameEvents} from "@/game-root/events/GameEvents.ts";


const Catalog: React.FC<GameProps> = ({game, blockIconMap}) => {
    const [slots, setSlots] = useState<SlotType[]>([]);
    const [isShow, setIsShow] = useState(false);

    useEffect(() => {
        const items = blockFactory.getAllRegisterBlocks().map(blockType => ({
            key: blockType,
            value: 1,
            icon: blockIconMap[blockType],
            source: "Catalog",
        }));
        setSlots(items);
    }, [blockIconMap,setSlots]);

    useEffect(() => {
        const callback = () => setIsShow(false);
        gameEventBus.on(GameEvents.hiddenPanel, callback);
        return () => gameEventBus.off(GameEvents.hiddenPanel, callback);
    }, [setIsShow]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === "e") {
                setIsShow(!isShow);
                game.togglePointerLock();
            }
        };
        game.addEventListener("keydown", handleKeyDown);
        return () => game.removeEventListener("keydown", handleKeyDown);
    }, [isShow]);


    return (
        <div style={isShow ? {} : {display: "none"}} className="catalog-panel">
            {slots.map((slot, index) => (
                <Slot
                    key={index}
                    slot={slot}
                    draggable
                />
            ))}
        </div>
    );
};

export default Catalog;
