export enum Assets {
	blocksTexture = "/textures/原版.png",
	playerModel = "/models/HumanMale.gltf",
}

export const getBlockModel = (modelName: string, suffix = ".gltf") =>
	"/models/blocks/" + modelName + suffix;
