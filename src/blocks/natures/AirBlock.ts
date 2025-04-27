import {Block} from "@/blocks/core/Block.ts";
import {Scene, Vector3} from "@babylonjs/core";
import {Blocks} from "@/blocks/core/Blocks.ts";

class AirBlock extends Block {
    static __blockType = Blocks.Air;
    constructor(scene: Scene, position: Vector3) {
        super({scene, position, isTransparent: true});
    }

    override render(): void {
    }

    override renderIcon(): void {
    }

    override dispose(): void {
    }
}

export default AirBlock;