import React from "react";
import Slot, {SlotType} from "../slot";
import "./index.less";

interface InventoryGridProps {
    slots: (SlotType | undefined)[];
    columns: number;
    rows: number;
}

const InventoryGrid: React.FC<InventoryGridProps> = ({slots, columns, rows}) => {

    return (
        <div
            className="inventory-grid"
            style={{
                gridTemplateColumns: `repeat(${columns},auto)`, // 不能缺少宽度，auto使用子元素的宽度
                gridTemplateRows: `repeat(${rows},auto)`,
            }}
        >
            {Array.from({length: columns * rows}).map((_, i) => (
                <Slot key={i} slot={slots[i]}/>
            ))}
        </div>
    );
};

export default InventoryGrid;
