import { Blocks } from "@/blocks/core/Blocks.ts";

export enum GameEvents {
	hiddenPanel,
	placeBlack,
	destroyBlock,
	onInteract,
	interactWithBlock,
}

export interface IGameEvents {
	InteractWithBlock: {
		blockType: Blocks;
		guid: string;
	};
}
