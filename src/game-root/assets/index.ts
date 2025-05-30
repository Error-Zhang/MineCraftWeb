import blockTextureAtlas from "./blocks/Blocks.webp";
import Cactus from "./blocks/models/Cactus.gltf";
import CraftTable from "./blocks/models/CraftTable.gltf";
import HumanMale from "./player/models/HumanMale.gltf";

const Assets = {
	blocks: {
		models: {
			Cactus,
			CraftTable,
		},
		atlas: blockTextureAtlas,
	},
	player: {
		models: {
			HumanMale,
		},
	},
};
export default Assets;
