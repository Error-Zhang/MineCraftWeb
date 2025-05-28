import React, { useState } from "react";
import CraftingPanel from "@/ui-root/views/craft-table/CraftingPanel.tsx";
import BlockType from "@/game-root/block-definitions/BlockType.ts";
import { BlockRecipe } from "@/game-root/block-definitions/BlockRecipes.ts";

const CraftTable: React.FC<{ guid: string }> = ({ guid }) => {
	const [recipes, setRecipes] = useState<Record<BlockType, BlockRecipe[]>>({} as any);

	return <CraftingPanel title="工作台" guid={guid} rows={3} columns={3} recipes={recipes} />;
};

export default CraftTable;
