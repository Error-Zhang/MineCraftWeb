import React, { useContext, useState } from "react";
import Slot, { createEmptySlots, SlotType } from "../../components/slot";
import "./index.less";
import { GameContext } from "@/ui-root/GameUI.tsx";
import { useInventorySlots } from "@/ui-root/components/inventory-grid/useInventorySlots.tsx";
import { HOTBAR_SIZE, useGameControls } from "@/ui-root/views/hotbar/useGameControls.tsx";

const HotBar: React.FC = () => {
	const { game, gameMode, blockIconMap } = useContext(GameContext);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [slots, setSlots] = useState<SlotType[]>(createEmptySlots(HOTBAR_SIZE));

	// 直接一行搞定所有监听！
	useGameControls({
		game,
		gameMode,
		slots,
		setSlots,
		selectedIndex,
		setSelectedIndex,
	});

	const { setDroppedIndex, onDrop } = useInventorySlots("HotBar", slots, setSlots);

	return (
		<div className="hotbar-container">
			{slots.map((item, index) => (
				<Slot
					key={index}
					className="slot-hotbar"
					selected={index === selectedIndex}
					slot={item}
					draggable
					allowedDropSources={["all"]}
					onDragStart={() => {
						setDroppedIndex(index);
					}}
					onDrop={droppedSlot => onDrop(droppedSlot, index)}
				/>
			))}
		</div>
	);
};

export default HotBar;
