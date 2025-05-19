import { BASE_URL, get } from "@/api/request.ts";

interface IBlockType {
	blockType: string;
	blockId: number;
}

const blockApi = {
	getBlockTypes() {
		return get<IBlockType>("/block/types");
	},
	getBlockIconUrl(blockType: string) {
		return `${BASE_URL}/assets/icons/${blockType}.webp`;
	},
};
export default blockApi;
