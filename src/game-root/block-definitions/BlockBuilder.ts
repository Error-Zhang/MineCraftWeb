import { AbstractMesh, Vector3, Vector4 } from "@babylonjs/core";
import BlockType from "./BlockType.ts";
import {
	BlockProperties,
	CrossRender,
	CubeRender,
	MeshProperties,
	ModelRender,
	RenderComponent,
	RenderMaterial,
	TransparencyType,
} from "@engine/types/block.type.ts";
import BlockMeshRegistry from "@engine/block/BlockMeshRegistry.ts";
import { blocksUvTable } from "@/game-root/block-definitions/TextureAtlas.ts";
import { BlockMaterialManager } from "@engine/renderer/BlockMaterialManager.ts";

// 标签分类
export const TAGS = {
	NATURE: {
		TERRAIN: "地形",
		PLANT: "植物",
		TREE: "树木",
		FLOWER: "花卉",
		DECORATION: "装饰",
	},
	FUNCTIONAL: {
		CRAFTING: "制作",
		INTERACTIVE: "交互",
		LIQUID: "液体",
	},
} as const;

// 工具函数
function createCubeRender(
	uvs: Vector4[],
	transparencyType: CubeRender["transparencyType"],
	material: RenderMaterial
): CubeRender {
	return {
		type: "cube",
		uvs,
		transparencyType,
		material,
	};
}

function createCrossRender(
	uvs: Vector4[],
	uvIndex: number = 0,
	material: RenderMaterial
): CrossRender {
	return {
		type: "cross",
		uvs,
		uvIndex,
		material,
	};
}

function createModelRender(
	path: string,
	uvs?: Vector4[],
	setMesh?: (mesh: AbstractMesh) => void
): ModelRender {
	return {
		type: "model",
		uvs,
		loadModel: async (scene, position) => {
			const material = BlockMaterialManager.getMaterialByKey(
				scene,
				BlockMaterialManager.PRESET_MATERIALS.MODEL
			);
			const defaultSetMesh = (mesh: AbstractMesh) => {
				mesh.material = material;
				mesh.isPickable = false;
			};
			setMesh = setMesh ?? defaultSetMesh;
			const node = await BlockMeshRegistry.loadModel(path, scene, setMesh);
			node.position = position.add(new Vector3(0.5, 0, 0.5));
			BlockMeshRegistry.attachCollider(scene, node);
			return node;
		},
	};
}

export interface BlockMetaData {
	displayName: string;
	maxStackCount: number;

	[key: string]: any; // 允许任意属性
}

// 通用方块构造器
export class BlockBuilder {
	private block: {
		id?: number;
		blockType: BlockType;
		metaData: BlockMetaData;
		options: {
			properties?: Partial<BlockProperties>;
			materialOptions?: RenderMaterial;
			meshOptions?: MeshProperties;
		};
		tags: string[];
		render: RenderComponent;
	};

	constructor(type: BlockType, displayName: string, id?: number) {
		this.block = {
			id,
			blockType: type,
			metaData: { displayName, maxStackCount: 40 },
			options: {},
			tags: [],
			render: {} as RenderComponent,
		};
	}

	withMetaData(
		metaData: Partial<{ displayName: string; maxStackCount: number } & Record<string, any>>
	) {
		this.block.metaData = { ...this.block.metaData, ...metaData };
		return this;
	}

	withTags(...tags: string[]) {
		this.block.tags = [...new Set([...this.block.tags, ...tags])];
		return this;
	}

	withProperties(properties: Partial<BlockProperties>) {
		this.block.options.properties = properties;
		return this;
	}

	withMeshOptions(meshOptions: MeshProperties) {
		this.block.options.meshOptions = meshOptions;
		if (this.block.options.materialOptions) {
			this.block.options.materialOptions.meshProperties = meshOptions;
		}
		return this;
	}

	withMaterialOptions(materialOptions: Partial<RenderMaterial>, presetMatKey?: string) {
		if (presetMatKey) {
			materialOptions = Object.assign(
				BlockMaterialManager.getMaterialPreset(presetMatKey) || {},
				materialOptions
			);
		}
		if (materialOptions.matKey) {
			BlockMaterialManager.registerCustomMaterial(materialOptions.matKey, materialOptions);
		}
		this.block.options.materialOptions = {
			matKey: materialOptions.matKey || presetMatKey || "",
			...materialOptions,
		};
		return this;
	}

	asCube(transparencyType: TransparencyType, materialKey: string = "") {
		if (!materialKey && !this.block.options.materialOptions?.matKey) {
			throw new Error("material key missing");
		}
		this.block.render = createCubeRender(
			blocksUvTable[this.block.blockType].faceUvs!,
			transparencyType,
			{
				...this.block.options.materialOptions,
				matKey: this.block.options.materialOptions?.matKey || materialKey,
			}
		);
		return this;
	}

	asCross(stage: number = 0) {
		if (!blocksUvTable[this.block.blockType].stageUvs) {
			throw new Error("stageUvs missing");
		} else if (stage >= blocksUvTable[this.block.blockType].stageUvs!.length) {
			throw new Error("stage overflow");
		}
		this.block.render = createCrossRender(blocksUvTable[this.block.blockType].stageUvs!, stage, {
			...this.block.options.materialOptions,
			matKey:
				this.block.options.materialOptions?.matKey || BlockMaterialManager.PRESET_MATERIALS.CROSS,
		});
		return this;
	}

	asModel(path: string, setMesh?: (mesh: AbstractMesh) => void) {
		this.block.render = createModelRender(
			path,
			blocksUvTable[this.block.blockType].modelUvs,
			setMesh
		);
		return this;
	}

	build() {
		return this.block;
	}
}
