import React from "react";
import Slot, {SlotType} from "../slot";
import "./index.less";
import {useInventorySlots} from "@/ui-root/hooks/useInventorySlots.tsx";

interface InventoryGridProps {
    source: string;
    slots: SlotType[];
    setSlots: (slots: SlotType[]) => void;
    onDrop?: (droppedSlot: SlotType, current: number) => boolean;
    onDropOver?: (droppedSlot: SlotType, current: number) => void;
    columns: number;
    rows: number;
}

const InventoryGrid: React.FC<InventoryGridProps> = ({source, slots, setSlots, onDrop,onDropOver, columns, rows}) => {
    const {setDroppedIndex, onDrop:onDropDefault} = useInventorySlots(source, slots, setSlots,{overrideOnDrop:onDrop});

    return (
        <div
            className="inventory-grid"
            style={{
                gridTemplateColumns: `repeat(${columns},auto)`, // 不能缺少宽度，auto使用子元素的宽度
                gridTemplateRows: `repeat(${rows},auto)`,
            }}
        >
            {Array.from({length: columns * rows}).map((_, i) => (
                <Slot
                    key={i}
                    slot={slots[i]}
                    draggable
                    allowedDropSources={["all"]}
                    onDragStart={() => {
                        setDroppedIndex(i)
                    }}
                    onDrop={(droppedSlot) => {
                        onDropDefault(droppedSlot, i);
                        onDropOver?.(droppedSlot, i);
                    }}
                />
            ))}
        </div>
    );
};

export default InventoryGrid;
