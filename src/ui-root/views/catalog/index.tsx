import React, { useContext, useEffect, useState } from "react";
import "./index.less";
import Slot, { SlotType } from "@/ui-root/components/slot";
import { GameContext } from "@/ui-root/GameUI.tsx";
import { useToggleActive } from "@/ui-root/hooks/useToggle.tsx";
import blockFactory from "@/block-design/core/BlockFactory.ts";

const Catalog: React.FC = () => {
	const { game } = useContext(GameContext);
	const [slots, setSlots] = useState<SlotType[]>([]);
	const [isActive, setIsActive] = useState(false);

	useEffect(() => {
		const items = blockFactory.getDisplayBlockTypes().map(blockType => ({
			key: blockType,
			value: 1,
			source: "Catalog",
		}));
		setSlots(items);
	}, []);

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
