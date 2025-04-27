export enum Assets {
    blocksTexture = "/textures/blocks.png",
    playerModel = "/models/HumanMale.gltf",

}
export const getBlockModel=(modelName:string,suffix=".gltf")=> "/models/blocks/" + modelName + suffix;