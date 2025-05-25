import React, { useEffect, useState } from "react";
import blockFactory from "@/block/core/BlockFactory.ts";
import CraftingPanel from "@/ui-root/views/craft-table/CraftingPanel.tsx";
import { Blocks } from "@/block/core/Blocks.ts";
import { BlockRecipe } from "@/block/core/BlockTypes.ts";

const CraftTable: React.FC<{ guid: string }> = ({ guid }) => {
	const [recipes, setRecipes] = useState<Record<Blocks, BlockRecipe[]>>({} as any);

	useEffect(() => {
		setRecipes(blockFactory.getAllBlockRecipes());
	}, []);

	return <CraftingPanel title="工作台" guid={guid} rows={3} columns={3} recipes={recipes} />;
};

export default CraftTable;
