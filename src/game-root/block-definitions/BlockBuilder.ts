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
import { TAG_GETTERS } from "./BlockTags.ts";

type CubeGetters = Pick<CubeRender, "getUv" | "getColor" | "getRotation">;
type CrossGetters = Pick<CrossRender, "getStage" | "getColor">;

// 工具函数
function createCubeRender(
	uvs: Vector4[],
	transparencyType: CubeRender["transparencyType"],
	material: RenderMaterial,
	getters?: CubeGetters
): CubeRender {
	return {
		type: "cube",
		uvs,
		transparencyType,
		material,
		...getters,
	};
}

function createCrossRender(
	uvs: Vector4[],
	material: RenderMaterial,
	getters?: CrossGetters
): CrossRender {
	return {
		type: "cross",
		uvs,
		material,
		...getters,
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
		loadModel: async (scene, matManager: BlockMaterialManager, position) => {
			const material = matManager.getMaterialByKey(BlockMaterialManager.PRESET_MATERIALS.MODEL);
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
		};
		tags: string[];
		render: RenderComponent;
		cubeGetters?: Pick<CubeRender, "getUv" | "getColor" | "getRotation">;
		crossGetters?: Pick<CrossRender, "getStage" | "getColor">;
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

		// 应用标签对应的 getter
		for (const tag of tags) {
			const getters = TAG_GETTERS[tag];
			if (getters) {
				if (getters.cube) {
					this.block.cubeGetters = {
						...this.block.cubeGetters,
						...getters.cube,
					};
				}
				if (getters.cross) {
					this.block.crossGetters = {
						...this.block.crossGetters,
						...getters.cross,
					};
				}
			}
		}
		return this;
	}

	withProperties(properties: Partial<BlockProperties>) {
		this.block.options.properties = properties;
		return this;
	}

	withMeshOptions(meshOptions: MeshProperties) {
		let materialOptions = this.block.options.materialOptions;
		if (materialOptions) {
			materialOptions.meshProperties = meshOptions;
		} else {
			this.block.options.materialOptions = {
				matKey: "",
				meshProperties: meshOptions,
			};
		}
		return this;
	}

	withColor() {}

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
			...materialOptions,
			matKey: materialOptions.matKey || presetMatKey || "",
		};
		return this;
	}

	withCubeGetters(getters: CubeGetters) {
		this.block.cubeGetters = getters;
		return this;
	}

	withCrossGetters(getters: CrossGetters) {
		this.block.crossGetters = getters;
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
			},
			this.block.cubeGetters
		);
		return this;
	}

	asCross() {
		if (!blocksUvTable[this.block.blockType].stageUvs) {
			throw new Error("stageUvs missing");
		}
		this.block.render = createCrossRender(
			blocksUvTable[this.block.blockType].stageUvs!,
			{
				...this.block.options.materialOptions,
				matKey:
					this.block.options.materialOptions?.matKey || BlockMaterialManager.PRESET_MATERIALS.CROSS,
			},
			this.block.crossGetters
		);
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
