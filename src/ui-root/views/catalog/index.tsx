import React, { useContext, useEffect, useState } from "react";
import "./index.less";
import Slot, { SlotType } from "@/ui-root/components/slot";
import blockFactory from "@/blocks/core/BlockFactory.ts";
import { GameContext } from "@/ui-root/GameUI.tsx";
import { useToggleActive } from "@/ui-root/hooks/useToggle.tsx";

const Catalog: React.FC = () => {
	const { game, gameMode, blockIconMap } = useContext(GameContext);
	const [slots, setSlots] = useState<SlotType[]>([]);
	const [isActive, setIsActive] = useState(false);

	useEffect(() => {
		const items = blockFactory.getAllRegisterBlocks().map(blockType => ({
			key: blockType,
			value: blockFactory.getBlockClass(blockType)?.maxCount || 0,
			icon: blockIconMap[blockType],
			source: "Catalog",
		}));
		setSlots(items);
	}, [blockIconMap, setSlots]);

	useToggleActive(game, setIsActive, "tab");

	return (
		<div
			style={
				isActive
					? {}
					: {
							display: "none",
						}
			}
			className="catalog-panel"
		>
			{slots.map((slot, index) => (
				<Slot key={index} slot={slot} draggable showCount={false} />
			))}
		</div>
	);
};

export default Catalog;
