import { Block } from "@/blocks/core/Block.ts";
import { Blocks } from "@/blocks/core/Blocks.ts";
import { Faces } from "../core/BlockMeshBuilder";

class AirBlock extends Block {
	static override __blockType = Blocks.Air;
	static override __isTransparent = true;

	tryRender(faces?: Faces): void {}

	setActive(active: boolean): void {}

	override render(): void {}

	override renderIcon(): void {}

	override dispose(): void {}
}

export default AirBlock;
