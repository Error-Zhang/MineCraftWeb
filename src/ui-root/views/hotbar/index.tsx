import React, {useEffect, useState} from "react";
import Slot, {createEmptySlots, SlotType} from "../../components/slot";
import "./index.less";
import {Blocks} from "@/blocks/core/Blocks.ts";
import gameEventBus from "@/game-root/events/GameEventBus.ts";
import {GameEvents} from "@/game-root/events/GameEvents.ts";
import useLongPress from "@/ui-root/hooks/useLongPress.tsx";
import {GameProps} from "@/ui-root/GameUI.tsx";
import {useInventorySlots} from "@/ui-root/hooks/useInventorySlots.tsx";

const HOTBAR_SIZE = 9;

const HotBar: React.FC<GameProps> = ({gameMode,game, blockIconMap}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [slots, setSlots] = useState<SlotType[]>(createEmptySlots(HOTBAR_SIZE));

    // 键盘快捷键（1-9）
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const num = parseInt(e.key);
            if (num >= 1 && num <= HOTBAR_SIZE) {
                setSelectedIndex(num - 1);
            }
        };
        game.addEventListener("keydown", handleKey);
        return () => game.removeEventListener("keydown", handleKey);
    }, [setSelectedIndex]);

    // 鼠标滚轮切换
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            setSelectedIndex((prev) =>
                (prev + (e.deltaY > 0 ? 1 : -1) + HOTBAR_SIZE) % HOTBAR_SIZE
            );
        };
        game.addEventListener("wheel", handleWheel);
        return () => game.removeEventListener("wheel", handleWheel);
    }, [setSelectedIndex]);

    // 监听鼠标右键点击
    useEffect(() => {
        const handlePointerDown = (e: MouseEvent) => {
            if (e.button === 2) { // 右键
                const slot: SlotType = slots[selectedIndex];
                if (slot && slot.value > 0) {
                    gameEventBus.emit(GameEvents.placeBlack, {blockType: slot.key}, () => {
                        gameMode !== "creative" &&  --slot.value;
                        setSlots([...slots]);
                    });
                }

            }
        };
        game.addEventListener("pointerdown", handlePointerDown);
        return () => game.removeEventListener("pointerdown", handlePointerDown);
    }, [slots, selectedIndex]);

    // 监听玩家与方块交互
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === "f") {
                gameEventBus.emit(GameEvents.interactWithBlock)
            }
        };
        game.addEventListener("keydown", handleKeyDown);
        return () => game.removeEventListener("keydown", handleKeyDown);
    }, []);

    // 监听鼠标左键长按
    useLongPress({
        game,
        onLongPress: () => {
            gameEventBus.emit(GameEvents.destroyBlock);
        },
        delay: 300,
        interval: 300,
        button: 0, // 左键
        enabled: true, // 可控制是否启用，比如游戏暂停时设为 false
    });

    // 加载图标
    useEffect(() => {

    }, [blockIconMap]);

    const { setDroppedIndex, onDrop } = useInventorySlots("HotBar",slots,setSlots);

    return (
        <div className="hotbar-container">
            {slots.map((item, index) => (
                <Slot
                    key={index}
                    selected={index === selectedIndex}
                    slot={item}
                    isTransparent
                    draggable
                    allowedDropSources={["all"]}
                    onDragStart={() => {
                        setDroppedIndex(index);
                    }}
                    onDrop={(droppedSlot) => onDrop(droppedSlot, index)}
                />
            ))}
        </div>
    );
};

export default HotBar;
