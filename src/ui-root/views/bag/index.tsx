import React, { useContext, useEffect, useState } from "react";
import "./index.less";
import CraftTable from "@/ui-root/views/craft-table";
import InventoryGrid from "@/ui-root/components/inventory-grid";
import { createEmptySlots } from "@/ui-root/components/slot";
import { useToggleActive } from "@/ui-root/hooks/useToggle.tsx";
import { GameContext } from "@/ui-root/GameUI.tsx";
import { gameEventBus } from "@/game-root/events/GameEventBus.ts";
import { GameEvents, IGameEvents } from "@/game-root/events/GameEvents.ts";
import { Blocks } from "@/blocks/core/Blocks.ts";

const PanelMap: Partial<Record<Blocks, React.FC<{ guid: string }>>> = {
	[Blocks.CraftTable]: ({ guid }) => <CraftTable guid={guid} />,
};

const getPanel = (blockInfo: IGameEvents["InteractWithBlock"]) => {
	const PanelComponent = PanelMap[blockInfo.blockType];
	return PanelComponent && <PanelComponent guid={blockInfo.guid} />;
};
const Bag: React.FC<{ rows: number; columns: number }> = ({ rows, columns }) => {
	const { game } = useContext(GameContext);
	const [slots, setSlots] = useState(createEmptySlots(rows * columns));
	const [isActive, setIsActive] = useState(false);

	const [activeBlock, setActiveBlock] = useState<IGameEvents["InteractWithBlock"]>({} as any);

	useToggleActive(game, setIsActive, "e", () => {
		setActiveBlock({} as any);
	});
	useEffect(() => {
		const interactWithCraftTable = (blockInfo: IGameEvents["InteractWithBlock"]) => {
			setActiveBlock(blockInfo);
			setIsActive(true);
			game.togglePointerLock();
		};

		gameEventBus.on(GameEvents.interactWithBlock, interactWithCraftTable);

		return () => {
			gameEventBus.off(GameEvents.interactWithBlock, interactWithCraftTable);
		};
	}, []);
	return (
		isActive && (
			<div className="bag-panel absolute-center">
				{getPanel(activeBlock)}
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
