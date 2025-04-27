import {useEffect, useState} from "react";
import {Blocks} from "@/blocks/core/Blocks";
import {SlotType} from "@/ui-root/components/slot";
import gameEventBus from "@/game-root/events/GameEventBus.ts";
import {GameEvents} from "@/game-root/events/GameEvents.ts"; // 记得改路径


export function useInventorySlots(
    source: string,
    slots: SlotType[],
    setSlots: (slots: SlotType[]) => void,
    config?: {
        onDropOver?: () => void,
        overrideOnDrop?: (droppedSlot: SlotType, current: number) => boolean,
    }
) {

    const [droppedIndex, setDroppedIndex] = useState<number>(-1);

    // 自动清理空格
    useEffect(() => {
        let needUpdate = false;
        const cleaned = slots.map((slot) => {
            if (slot && slot.value <= 0 && slot.key !== Blocks.Air) {
                needUpdate = true;
                return null;
            }
            return slot;
        });

        if (needUpdate) {
            setSlots(cleaned);
        }
    }, [slots]);

    // 拖拽逻辑,这里是落下的slot执行
    const onDrop = (droppedSlot: SlotType, current: number) => {

        const currentSlot = slots[current] || {key: Blocks.Air, source};
        if (!config?.overrideOnDrop?.(droppedSlot, current)) {
            // 叠加
            if (currentSlot.key === droppedSlot!.key) {
                slots[current]!.value += droppedSlot!.value;
            }
            // 交换
            else {
                slots[current] = droppedSlot;
            }
        }

        gameEventBus.emit("dropOver", {droppedSlot, currentSlot});
        droppedSlot!.source = source; // 更新当前源
        setSlots([...slots]); // 后更新
    };
    // 处理不同源的情况，这里是起始的slot执行
    useEffect(() => {
        const callback = ({droppedSlot, currentSlot}: any) => {
            // 更新另一端
            if (droppedSlot!.source === source) {
                if (currentSlot.key === droppedSlot!.key) {
                    slots[droppedIndex]!.value -= droppedSlot!.value;
                } else {
                    slots[droppedIndex] = currentSlot.key === Blocks.Air ? null : currentSlot;
                }
                setSlots([...slots]);
                config?.onDropOver?.();
                setDroppedIndex(-1);
            }

        }
        gameEventBus.on("dropOver", callback);
        return () => gameEventBus.off("dropOver", (callback)); // 注意一定要关闭监听
    }, [slots, setSlots, droppedIndex]);

    return {
        setDroppedIndex,
        onDrop,
    };
}
