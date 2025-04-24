import React, {useEffect, useState} from "react";
import Slot, {SlotType} from "../../components/slot";
import "./index.less";
import {BlockIconStore} from "@/game-root/block-icon-module/store.ts";
import {Blocks} from "@/enums/Blocks.ts";
import eventBus from "@/game-root/utils/EventBus.ts";
import {GameEvents} from "@/enums/GameEvents.ts";
import useLongPress from "@/ui-root/hooks/useLongPress.tsx";
import GameEventManager from "@/game-root/utils/GameEventManager.ts";

const HOTBAR_SIZE = 9;

const HotBar: React.FC<{
    gameEventManager: GameEventManager,
    blockIconMap: Record<string, string>
}> = ({gameEventManager, blockIconMap}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [hotBar, setHotBar] = useState<SlotType[]>(Array.from({length: 9}).map(() => ({
        key: Blocks.Air,
        value: 1,
        icon: "",
        source: ""
    })))
    const [droppedIndex, setDroppedIndex] = useState<number>(-1);

    // 键盘快捷键（1-9）
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const num = parseInt(e.key);
            if (num >= 1 && num <= HOTBAR_SIZE) {
                setSelectedIndex(num - 1);
            }
        };
        gameEventManager.addEventListener("keydown", handleKey);
        return () => gameEventManager.removeEventListener("keydown", handleKey);
    }, []);

    // 鼠标滚轮切换
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            setSelectedIndex((prev) =>
                (prev + (e.deltaY > 0 ? 1 : -1) + HOTBAR_SIZE) % HOTBAR_SIZE
            );
        };
        gameEventManager.addEventListener("wheel", handleWheel);
        return () => gameEventManager.removeEventListener("wheel", handleWheel);
    }, []);

    // 监听鼠标右键点击
    useEffect(() => {
        const handlePointerDown = (e: MouseEvent) => {
            if (e.button === 2) { // 右键
                const slot: SlotType = hotBar[selectedIndex];
                if (slot.key !== Blocks.Air && slot.value > 0) {
                    eventBus.emit(GameEvents.placeBlack, {blockType: slot.key}, () => {
                        --slot.value;
                        setHotBar([...hotBar]);
                    });
                }

            }
        };
        gameEventManager.addEventListener("pointerdown", handlePointerDown);
        return () => gameEventManager.removeEventListener("pointerdown", handlePointerDown);
    }, [hotBar, selectedIndex]);

    // 监听鼠标左键长按
    useLongPress({
        gameEventManager,
        onLongPress: () => {
            eventBus.emit(GameEvents.destroyBlock);
        },
        delay: 300,
        interval: 100,
        button: 0, // 左键
        enabled: true, // 可控制是否启用，比如游戏暂停时设为 false
    });

    // 加载图标
    useEffect(() => {

    }, [blockIconMap]);

    // 监听清理空格
    useEffect(() => {
        let needUpdate = false;
        const cleaned = hotBar.map((slot) => {
            if (slot && slot.value <= 0 && slot.key !== Blocks.Air) {
                needUpdate = true;
                return {
                    key: Blocks.Air,
                    value: 0,
                    icon: "",
                    source: "hotbar"
                };
            }
            return slot;
        });

        if (needUpdate) {
            setHotBar(cleaned);
        }
    }, [hotBar]);

    return (
        <div className="hotbar-container">
            {hotBar.map((item, index) => (
                <Slot
                    key={index}
                    selected={index === selectedIndex}
                    slot={item}
                    isTransparent
                    draggable
                    allowedDropSources={["hotbar", "catalog"]}
                    onDragStart={() => {
                        setDroppedIndex(index);
                    }}
                    onDrop={(droppedSlot) => {
                        if (!droppedSlot) return;

                        const currentSlot = hotBar[index];
                        const newHotBar = [...hotBar];

                        // 同类物品叠加，不同类交换
                        if (currentSlot.key === droppedSlot.key) {
                            newHotBar[index].value += droppedSlot.value;
                            droppedIndex!==-1 && (newHotBar[droppedIndex].value -= droppedSlot.value);
                        } else {
                            newHotBar[index] = droppedSlot;
                            droppedIndex!==-1 && (newHotBar[droppedIndex] = currentSlot);
                        }

                        setHotBar(newHotBar);
                        setDroppedIndex(-1);
                    }}
                />
            ))}
        </div>
    );
};

export default HotBar;
