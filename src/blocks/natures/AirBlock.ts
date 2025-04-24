import {Block} from "@/blocks/Block.ts";
import {Scene, Vector3} from "@babylonjs/core";
import {Blocks} from "@/enums/Blocks.ts";

class AirBlock extends Block {
    constructor(scene: Scene, position: Vector3) {
        super({scene, blockType: Blocks.Air, position, isTransparent: true});
    }

    override render(): void {
    }

    override renderIcon(): void {
    }

    override dispose(): void {
    }
}

export default AirBlock;