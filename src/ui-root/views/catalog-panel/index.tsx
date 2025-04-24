import React, {useEffect, useState} from "react";
import "./index.less";
import Slot, {SlotType} from "@/ui-root/components/slot";
import blockFactory from "@/game-root/utils/BlockFactory.ts";
import GameEventManager from "@/game-root/utils/GameEventManager.ts";


const CatalogPanel: React.FC<{
    gameEventManager: GameEventManager,
    blockIconMap: Record<string, string>
}> = ({gameEventManager, blockIconMap}) => {
    const [slots, setSlots] = useState<SlotType[]>([]);
    const [isShow, setIsShow] = useState(false);

    useEffect(() => {
        const items = blockFactory.getAllRegisterBlocks().map(blockType => ({
            key: blockType,
            value: 1,
            icon: blockIconMap[blockType],
            source: "catalog",
        }));
        setSlots(items);
    }, [blockIconMap]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === "e") {
                if (gameEventManager.isActive && !isShow) {
                    setIsShow(!isShow);
                    gameEventManager.togglePointerLock();
                } else if (gameEventManager.isActive && isShow) {
                    setIsShow(!isShow);
                } else if (isShow) {
                    setIsShow(!isShow);
                    gameEventManager.togglePointerLock();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isShow, gameEventManager]);


    return (
        <div style={isShow ? {} : {display: "none"}} className="catalog-panel">
            {slots.map((slot, index) => (
                <Slot
                    key={slot.key}
                    slot={slot}
                    draggable
                />
            ))}
        </div>
    );
};

export default CatalogPanel;
