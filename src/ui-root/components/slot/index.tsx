import React from "react";
import "./index.less";
import { Blocks } from "@/enums/Blocks.ts";

export interface SlotType {
    key: Blocks;
    value: number;
    icon: string;
    source: string; // 如 "catalog" | "hotbar"
}

interface SlotProps {
    selected?: boolean;
    slot: SlotType | undefined;
    isTransparent?: boolean;
    onDragStart?: (slot: SlotType) => void;
    onDrop?: (slot: SlotType | undefined) => void;
    onDragOver?: () => void;
    allowedDropSources?: string[]; // 允许哪些来源的 slot 拖入
    draggable?: boolean; // 是否允许拖拽
}

const Slot: React.FC<SlotProps> = ({
                                       selected = false,
                                       isTransparent = false,
                                       slot,
                                       onDragStart,
                                       onDrop,
                                       onDragOver,
                                       allowedDropSources = [],
                                       draggable = false,
                                   }) => {
    const style = isTransparent ? { background: "rgba(0,0,0,0.1)", borderImage: "none" } : {};

    return (
        <div
            title={slot?.key}
            style={style}
            className={`slot ${selected ? "selected" : ""}`}
            draggable={!!slot && draggable}
            onDragStart={(e) => {
                if (slot && draggable) {
                    e.dataTransfer.setData("dragSlotData", JSON.stringify(slot));
                    onDragStart?.(slot);
                }
            }}
            onDrop={(e) => {
                e.preventDefault();
                const data = e.dataTransfer.getData("dragSlotData");
                const droppedSlot: SlotType = JSON.parse(data);
                if (allowedDropSources.includes(droppedSlot.source)) {
                    onDrop?.(droppedSlot);
                }
            }}
            onDragOver={(e) => {
                e.preventDefault();
                onDragOver?.();
            }}
        >
            {slot?.icon && <img className="slot-icon" src={slot.icon} alt="item" />}
            {slot && slot.value > 1 && <span className="slot-number">{slot.value}</span>}
        </div>
    );
};

export default Slot;
