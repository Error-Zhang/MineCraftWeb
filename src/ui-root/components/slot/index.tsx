import React from "react";
import "./index.less";
import {Blocks} from "@/blocks/core/Blocks.ts";
import {Nullable} from "@babylonjs/core";

export type SlotType = Nullable<{
    key: Blocks;
    value: number;
    icon: string;
    source: string; // 如 "catalog" | "hotbar"
}>

interface SlotProps {
    selected?: boolean;
    slot: SlotType;
    isTransparent?: boolean;
    onDragStart?: (slot: SlotType) => void;
    onDrop?: (slot: SlotType) => void;
    onDragOver?: () => void;
    allowedDropSources?: string[]; // 允许哪些来源的 slot 拖入
    draggable?: boolean; // 是否允许拖拽
}

export const createEmptySlots = (count:number):SlotType[] => {
    return Array.from({length:count}).map(_=>null)
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
            draggable={!!slot && slot.key!=Blocks.Air && draggable}
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
                if (allowedDropSources.includes(droppedSlot!.source)||allowedDropSources.includes("all")) {
                    onDrop?.(droppedSlot);
                }
            }}
            // 经过格子就会出发用来做效果
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
