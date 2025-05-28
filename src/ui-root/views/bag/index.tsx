import React, { useState } from "react";
import "./index.less";
import InventoryGrid from "@/ui-root/components/inventory-grid";
import { createEmptySlots } from "@/ui-root/components/slot";
import { useToggleActive } from "@/ui-root/hooks/useToggle.tsx";
import { useGameStore } from "@/store";

// const PanelMap: Partial<Record<BlockType, React.FC<{ guid: string }>>> = {
// 	[BlockType.CraftTableBlock]: ({ guid }) => <CraftTable guid={guid} />,
// };
//
// const getPanel = (blockInfo: any) => {
// 	const PanelComponent = PanelMap[blockInfo.blockType];
// 	return PanelComponent && <PanelComponent guid={blockInfo.guid} />;
// };
const Bag: React.FC<{ rows: number; columns: number }> = ({ rows, columns }) => {
	const [slots, setSlots] = useState(createEmptySlots(rows * columns));
	const [isActive, setIsActive] = useState(false);

	const [activeBlock, setActiveBlock] = useState({});

	useToggleActive(setIsActive, "e", () => useGameStore.getState().gameMode !== 0);

	return (
		isActive && (
			<div className="bag-panel absolute-center">
				{/*{getPanel(activeBlock)}*/}
				<div className="bag">
					<div className="panel-title">背包</div>
					<InventoryGrid
						rows={rows}
						columns={columns}
						source="Bag"
						slots={slots}
						setSlots={setSlots}
					/>
				</div>
			</div>
		)
	);
};
export default Bag;
