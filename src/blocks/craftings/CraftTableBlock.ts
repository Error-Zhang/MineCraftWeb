import {BlockEntity} from "@/blocks/BlockDecorators.ts";
import {Blocks} from "@/enums/Blocks.ts";
import {ModelBlock, TextureBlock} from "@/blocks/Block.ts";
import {AbstractMesh, Color3, Scene, StandardMaterial, Vector3} from "@babylonjs/core";
import {MaterialManager} from "@/game-root/utils/MaterialManager.ts";

@BlockEntity(Blocks.CraftTable)
class CraftTableBlock extends ModelBlock {
    constructor(scene: Scene, position: Vector3) {
        super({scene, blockType: Blocks.CraftTable, position, isTransparent: true});
    }

    override setMaterial(mesh: AbstractMesh, {noCache}: { noCache: boolean }): void {
        const material = MaterialManager.getBlockMaterial({
            scene: this.scene, texturePath: TextureBlock.texturePath, blockType: Blocks.CraftTable, noCache
        });
        mesh.material = material;
    }
}

export default CraftTableBlock;