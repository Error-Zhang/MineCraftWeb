import { AbstractMesh, Vector3, Vector4 } from "@babylonjs/core";
import BlockType from "./BlockType.ts";
import {
	BlockDefinition,
	BlockProperties,
	CrossRender,
	CubeRender,
	MaterialOptions,
	ModelRender,
	RenderComponent,
	RenderMaterial,
	TransparencyType,
} from "@engine/types/block.type.ts";
import BlockMeshRegistry from "@engine/block/BlockMeshRegistry.ts";
import Assets from "@/game-root/assets";
import { blocksUvTable } from "@/game-root/block-definitions/TextureAtlas.ts";
import { BlockMaterialManager } from "@engine/renderer/BlockMaterialManager.ts";

// 标签分类
const TAGS = {
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

// 通用方块构造器
class BlockBuilder {
	private block: {
		id?: number;
		name: BlockType;
		metaData: {
			displayName: string;
			maxStackCount?: number;
			[key: string]: any; // 允许任意属性
		};
		options: {
			properties?: Partial<BlockProperties>;
			materialOptions?: MaterialOptions;
		};
		tags: string[];
		render: RenderComponent;
	};

	constructor(type: BlockType, displayName: string, id?: number) {
		this.block = {
			id,
			name: type,
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

	withMaterialOptions(materialOptions: MaterialOptions) {
		this.block.options.materialOptions = materialOptions;
		return this;
	}

	asCube(transparencyType: TransparencyType, materialKey: string) {
		this.block.render = createCubeRender(
			blocksUvTable[this.block.name].faceUvs!,
			transparencyType,
			{
				matKey: materialKey,
				meshProperties: { isCollision: true },
				...this.block.options.materialOptions,
			}
		);
		return this;
	}

	asCross(stage: number = 0) {
		this.block.render = createCrossRender(blocksUvTable[this.block.name].stageUvs!, stage, {
			matKey: BlockMaterialManager.PRESET_MATERIALS.CROSS,
			meshProperties: { isCollision: true },
			...this.block.options.materialOptions,
		});
		return this;
	}

	asModel(path: string, setMaterial: (mesh: AbstractMesh) => void) {
		this.block.render = createModelRender(
			path,
			blocksUvTable[this.block.name].modelUvs!,
			setMaterial
		);
		return this;
	}

	build() {
		return this.block;
	}
}

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
	uvs: Vector4[],
	setMaterial: (mesh: AbstractMesh) => void
): ModelRender {
	return {
		type: "model",
		uvs,
		loadModel: async (scene, position, properties) => {
			const node = await BlockMeshRegistry.loadModel(path, scene, setMaterial);
			node.position = position.add(new Vector3(0.5, 0, 0.5));
			const material = properties.material as RenderMaterial;
			if (material?.meshProperties?.isCollision) {
				BlockMeshRegistry.attachCollider(scene, node);
			}
			return node;
		},
	};
}

// 方块定义
const blocks: BlockDefinition<any>[] = [
	// 基础方块
	new BlockBuilder(BlockType.GrassBlock, "草方块", 1)
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "草方块",
			maxStackCount: 64,
			hardness: 0.6,
			toolType: "shovel",
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.DirtBlock, "土方块", 2)
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "土方块",
			maxStackCount: 64,
			hardness: 0.5,
			toolType: "shovel",
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.ClayBlock, "粘土块")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "粘土块",
			maxStackCount: 64,
			hardness: 0.6,
			toolType: "shovel",
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	// 树叶方块
	new BlockBuilder(BlockType.OakLeavesBlock, "橡树叶")
		.withTags(TAGS.NATURE.TREE, TAGS.NATURE.PLANT)
		.withMetaData({
			displayName: "橡树叶",
			maxStackCount: 64,
			hardness: 0.2,
			toolType: "shears",
			flammable: true,
		})
		.asCube(TransparencyType.Cutout, BlockMaterialManager.PRESET_MATERIALS.LEAVES)
		.build(),

	new BlockBuilder(BlockType.BirchLeavesBlock, "桦树叶")
		.withTags(TAGS.NATURE.TREE, TAGS.NATURE.PLANT)
		.withMetaData({
			displayName: "桦树叶",
			maxStackCount: 64,
			hardness: 0.2,
			toolType: "shears",
			flammable: true,
		})
		.asCube(TransparencyType.Cutout, BlockMaterialManager.PRESET_MATERIALS.LEAVES)
		.build(),

	// 透明方块
	new BlockBuilder(BlockType.WaterBlock, "水")
		.withTags(TAGS.FUNCTIONAL.LIQUID)
		.withMetaData({
			displayName: "水",
			maxStackCount: 1,
			flowable: true,
			viscosity: 0.8,
		})
		.asCube(TransparencyType.Transparent, BlockMaterialManager.PRESET_MATERIALS.WATER)
		.build(),

	new BlockBuilder(BlockType.MagmaBlock, "岩浆")
		.withTags(TAGS.FUNCTIONAL.LIQUID)
		.withMetaData({
			displayName: "岩浆",
			maxStackCount: 1,
			flowable: true,
			viscosity: 0.3,
			damage: 4,
		})
		.asCube(TransparencyType.Transparent, BlockMaterialManager.PRESET_MATERIALS.LAVA)
		.build(),

	// 十字形方块
	new BlockBuilder(BlockType.TallGrassBlock, "高草")
		.withTags(TAGS.NATURE.PLANT)
		.withMetaData({
			displayName: "高草",
			maxStackCount: 64,
			hardness: 0,
			toolType: "shears",
			flammable: true,
		})
		.asCross(1)
		.build(),

	new BlockBuilder(BlockType.RedFlowerBlock, "红花")
		.withTags(TAGS.NATURE.FLOWER)
		.withMetaData({
			displayName: "红花",
			maxStackCount: 64,
			hardness: 0,
			flammable: true,
		})
		.asCross(1)
		.build(),

	// 模型方块
	new BlockBuilder(BlockType.CactusBlock, "仙人掌")
		.withTags(TAGS.NATURE.PLANT)
		.withMetaData({
			displayName: "仙人掌",
			maxStackCount: 64,
			hardness: 0.4,
			damage: 1,
			flammable: true,
		})
		.asModel(Assets.blocks.models.Cactus, mesh => {})
		.build(),

	new BlockBuilder(BlockType.CraftTableBlock, "工作台")
		.withTags(TAGS.FUNCTIONAL.CRAFTING)
		.withMetaData({
			displayName: "工作台",
			maxStackCount: 1,
			hardness: 2.5,
			toolType: "axe",
			interactable: true,
		})
		.asModel(Assets.blocks.models.CraftTable, mesh => {})
		.build(),

	// 矿石类方块
	new BlockBuilder(BlockType.CoalOreBlock, "煤矿")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "煤矿",
			maxStackCount: 64,
			hardness: 3.0,
			toolType: "pickaxe",
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.IronOreBlock, "铁矿")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "铁矿",
			maxStackCount: 64,
			hardness: 3.0,
			toolType: "pickaxe",
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.CopperOreBlock, "铜矿")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "铜矿",
			maxStackCount: 64,
			hardness: 3.0,
			toolType: "pickaxe",
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.SaltpeterOreBlock, "硝石矿")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "硝石矿",
			maxStackCount: 64,
			hardness: 2.5,
			toolType: "pickaxe",
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.SulphurOreBlock, "硫磺矿")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "硫磺矿",
			maxStackCount: 64,
			hardness: 2.5,
			toolType: "pickaxe",
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.DiamondOreBlock, "钻石矿")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "钻石矿",
			maxStackCount: 64,
			hardness: 3.0,
			toolType: "pickaxe",
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.GermaniumOreBlock, "锗矿")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "锗矿",
			maxStackCount: 64,
			hardness: 3.0,
			toolType: "pickaxe",
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	// 石头类方块
	new BlockBuilder(BlockType.SandBlock, "沙子")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "沙子",
			maxStackCount: 64,
			hardness: 0.5,
			toolType: "shovel",
			gravity: true,
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.SandStoneBlock, "砂岩")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "砂岩",
			maxStackCount: 64,
			hardness: 0.8,
			toolType: "pickaxe",
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.GraniteStoneBlock, "花岗岩")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "花岗岩",
			maxStackCount: 64,
			hardness: 1.5,
			toolType: "pickaxe",
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.BasaltStoneBlock, "玄武岩")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "玄武岩",
			maxStackCount: 64,
			hardness: 1.5,
			toolType: "pickaxe",
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.GravelStoneBlock, "沙砾")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "沙砾",
			maxStackCount: 64,
			hardness: 0.6,
			toolType: "shovel",
			gravity: true,
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.LimeStoneBlock, "石灰石")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "石灰石",
			maxStackCount: 64,
			hardness: 1.5,
			toolType: "pickaxe",
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	// 树木类方块
	new BlockBuilder(BlockType.SpruceWoodBlock, "云杉木")
		.withTags(TAGS.NATURE.TREE)
		.withMetaData({
			displayName: "云杉木",
			maxStackCount: 64,
			hardness: 2.0,
			toolType: "axe",
			flammable: true,
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.MimosaWoodBlock, "金合欢木")
		.withTags(TAGS.NATURE.TREE)
		.withMetaData({
			displayName: "金合欢木",
			maxStackCount: 64,
			hardness: 2.0,
			toolType: "axe",
			flammable: true,
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.PoplarWoodBlock, "白杨木")
		.withTags(TAGS.NATURE.TREE)
		.withMetaData({
			displayName: "白杨木",
			maxStackCount: 64,
			hardness: 2.0,
			toolType: "axe",
			flammable: true,
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.SpruceLeavesBlock, "云杉树叶")
		.withTags(TAGS.NATURE.TREE, TAGS.NATURE.PLANT)
		.withMetaData({
			displayName: "云杉树叶",
			maxStackCount: 64,
			hardness: 0.2,
			toolType: "shears",
			flammable: true,
		})
		.asCube(TransparencyType.Cutout, BlockMaterialManager.PRESET_MATERIALS.LEAVES)
		.build(),

	new BlockBuilder(BlockType.TallSpruceLeavesBlock, "高云杉树叶")
		.withTags(TAGS.NATURE.TREE, TAGS.NATURE.PLANT)
		.withMetaData({
			displayName: "高云杉树叶",
			maxStackCount: 64,
			hardness: 0.2,
			toolType: "shears",
			flammable: true,
		})
		.asCube(TransparencyType.Cutout, BlockMaterialManager.PRESET_MATERIALS.LEAVES)
		.build(),

	new BlockBuilder(BlockType.MimosaLeavesBlock, "金合欢树叶")
		.withTags(TAGS.NATURE.TREE, TAGS.NATURE.PLANT)
		.withMetaData({
			displayName: "金合欢树叶",
			maxStackCount: 64,
			hardness: 0.2,
			toolType: "shears",
			flammable: true,
		})
		.asCube(TransparencyType.Cutout, BlockMaterialManager.PRESET_MATERIALS.LEAVES)
		.build(),

	new BlockBuilder(BlockType.PoplarLeavesBlock, "白杨树叶")
		.withTags(TAGS.NATURE.TREE, TAGS.NATURE.PLANT)
		.withMetaData({
			displayName: "白杨树叶",
			maxStackCount: 64,
			hardness: 0.2,
			toolType: "shears",
			flammable: true,
		})
		.asCube(TransparencyType.Cutout, BlockMaterialManager.PRESET_MATERIALS.LEAVES)
		.build(),

	// 其他植物方块
	new BlockBuilder(BlockType.PurpleFlowerBlock, "紫花")
		.withTags(TAGS.NATURE.FLOWER)
		.withMetaData({
			displayName: "紫花",
			maxStackCount: 64,
			hardness: 0,
			flammable: true,
		})
		.asCross(1)
		.build(),

	new BlockBuilder(BlockType.WhiteFlowerBlock, "白花")
		.withTags(TAGS.NATURE.FLOWER)
		.withMetaData({
			displayName: "白花",
			maxStackCount: 64,
			hardness: 0,
			flammable: true,
		})
		.asCross(1)
		.build(),

	new BlockBuilder(BlockType.RyeBlock, "黑麦")
		.withTags(TAGS.NATURE.PLANT)
		.withMetaData({
			displayName: "黑麦",
			maxStackCount: 64,
			hardness: 0,
			toolType: "shears",
			flammable: true,
		})
		.asCross(0)
		.build(),

	new BlockBuilder(BlockType.CottonBlock, "棉花")
		.withTags(TAGS.NATURE.PLANT)
		.withMetaData({
			displayName: "棉花",
			maxStackCount: 64,
			hardness: 0,
			toolType: "shears",
			flammable: true,
		})
		.asCross(0)
		.build(),

	new BlockBuilder(BlockType.DryBushBlock, "干枯灌木")
		.withTags(TAGS.NATURE.PLANT)
		.withMetaData({
			displayName: "干枯灌木",
			maxStackCount: 64,
			hardness: 0,
			toolType: "shears",
			flammable: true,
		})
		.asCross(0)
		.build(),

	new BlockBuilder(BlockType.LargeDryBushBlock, "大型干枯灌木")
		.withTags(TAGS.NATURE.PLANT)
		.withMetaData({
			displayName: "大型干枯灌木",
			maxStackCount: 64,
			hardness: 0,
			toolType: "shears",
			flammable: true,
		})
		.asCross(0)
		.build(),

	// 其他方块
	new BlockBuilder(BlockType.IceBlock, "冰块")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "冰块",
			maxStackCount: 64,
			hardness: 0.5,
			toolType: "pickaxe",
			slippery: true,
		})
		.asCube(TransparencyType.Transparent, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.CoalBlock, "纯煤矿")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "纯煤矿",
			maxStackCount: 64,
			hardness: 5.0,
			toolType: "pickaxe",
			flammable: true,
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),

	new BlockBuilder(BlockType.OakPlankBlock, "橡木木板")
		.withTags(TAGS.NATURE.TERRAIN)
		.withMetaData({
			displayName: "橡木木板",
			maxStackCount: 64,
			hardness: 2.0,
			toolType: "axe",
			flammable: true,
		})
		.asCube(TransparencyType.Opaque, BlockMaterialManager.PRESET_MATERIALS.SOLID)
		.build(),
];

export default blocks;
