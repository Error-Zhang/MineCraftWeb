import React, {useEffect, useState} from "react";
import Slot, { SlotType } from "../../components/slot";
import "./index.less";
import InventoryGrid from "@/ui-root/components/inventory-grid";

interface CraftingPanelProps {
    gridSlots: (SlotType | undefined)[]; // 3x3 = 9个槽
    resultSlot?: SlotType;
}

const CraftingTablePanel: React.FC = () => {
    const [isShow] = useState(false);
    const [gridSlots]=useState<CraftingPanelProps['gridSlots']>([]);
    const [resultSlot,setResultSlot]=useState<CraftingPanelProps['resultSlot']>();

    return isShow && (
        <div className="crafting-panel absolute-center">
            <InventoryGrid slots={gridSlots} columns={3} rows={3}/>
            <div className="crafting-arrow">→</div>
            <Slot slot={resultSlot} />
        </div>
    );
};

export default CraftingTablePanel;
