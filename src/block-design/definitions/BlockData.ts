import BlockType from "./BlockType.ts";

export enum RenderType {
	Cube = "Cube",
	Model = "Model",
	Grass = "Grass",
}

export enum TransparencyType {
	Opaque, // 完全不透明
	Cutout, // 使用 alpha test（如树叶）
	Transparent, // 使用 alpha blend（水、玻璃）
}

export interface BlockDefinition {
	renderType: RenderType;
	modelPath?: string;
	isDisplay: boolean;
	displayName: string;
	isInteractable: boolean;
	isCollision: boolean;
	growable?: {
		maxStage: number;
	};
	maxCount: number;
	transparencyType: TransparencyType;
}

// 默认属性（除 displayName 外）
const defaultBlockDefinition: Omit<BlockDefinition, "displayName"> = {
	renderType: RenderType.Cube,
	isDisplay: true,
	isInteractable: false,
	isCollision: true,
	maxCount: 40,
	transparencyType: TransparencyType.Opaque,
};

// 通用构造函数
function defineBlock(
	displayName: string,
	override: Partial<BlockDefinition> = {}
): BlockDefinition {
	return {
		...defaultBlockDefinition,
		...override,
		displayName,
	};
}

// 快捷构造器
function cubeBlock(name: string, extra?: Partial<BlockDefinition>) {
	return defineBlock(name, { ...extra, renderType: RenderType.Cube });
}

function modelBlock(name: string, modelPath: string, extra?: Partial<BlockDefinition>) {
	return defineBlock(name, { ...extra, modelPath, renderType: RenderType.Model });
}

function cutoutBlock(name: string, extra?: Partial<BlockDefinition>) {
	return cubeBlock(name, { ...extra, transparencyType: TransparencyType.Cutout });
}

function plantBlock(name: string, extra?: Partial<BlockDefinition>) {
	return defineBlock(name, {
		...extra,
		isCollision: false,
		renderType: extra?.modelPath ? RenderType.Model : RenderType.Grass,
	});
}

// 工具函数：从元组批量注册
function defineBlocks<T>(
	items: [T, string][] | [T, string, Partial<BlockDefinition>?][],
	factory: (name: string, extra?: Partial<BlockDefinition>) => BlockDefinition
) {
	return Object.fromEntries(items.map(([type, name, extra]) => [type, factory(name, extra)]));
}

const blockData: Record<Exclude<BlockType, BlockType.AirBlock>, BlockDefinition> = {
	// 特殊方块
	[BlockType.WaterBlock]: defineBlock("水", {
		isDisplay: false,
		transparencyType: TransparencyType.Transparent,
		isCollision: false,
	}),
	[BlockType.MagmaBlock]: defineBlock("岩浆", {
		isDisplay: false,
		transparencyType: TransparencyType.Transparent,
		isCollision: false,
	}),

	// 基础方块
	...defineBlocks(
		[
			[BlockType.DirtBlock, "土方块"],
			[BlockType.GrassBlock, "草方块"],
			[BlockType.ClayBlock, "粘土块"],
			[BlockType.IceBlock, "冰方块"],
			[BlockType.SandBlock, "沙子"],
			[BlockType.SandStoneBlock, "沙石"],
			[BlockType.GraniteStoneBlock, "花岗岩"],
			[BlockType.BasaltStoneBlock, "玄武岩"],
			[BlockType.GravelStoneBlock, "沙砾"],
			[BlockType.LimeStoneBlock, "石灰石"],
			[BlockType.CoalBlock, "纯煤"],
			[BlockType.CoalOreBlock, "煤矿"],
			[BlockType.IronOreBlock, "铁矿"],
			[BlockType.CopperOreBlock, "铜矿"],
			[BlockType.SaltpeterOreBlock, "硝石矿"],
			[BlockType.SulphurOreBlock, "硫磺矿"],
			[BlockType.DiamondOreBlock, "钻石矿"],
			[BlockType.GermaniumOreBlock, "锗矿"],
			[BlockType.OakWoodBlock, "橡木"],
			[BlockType.BirchWoodBlock, "桦木"],
			[BlockType.SpruceWoodBlock, "云杉木"],
			[BlockType.MimosaWoodBlock, "金合欢木"],
			[BlockType.PoplarWoodBlock, "白杨木"],
			[BlockType.OakPlankBlock, "木板"],
		],
		cubeBlock
	),

	// 树叶类（Cutout）
	...defineBlocks(
		[
			[BlockType.OakLeavesBlock, "橡树叶"],
			[BlockType.BirchLeavesBlock, "桦树叶"],
			[BlockType.SpruceLeavesBlock, "云杉树叶"],
			[BlockType.TallSpruceLeavesBlock, "高云杉树叶"],
			[BlockType.MimosaLeavesBlock, "金合欢树叶"],
			[BlockType.PoplarLeavesBlock, "白杨树叶"],
		],
		cutoutBlock
	),

	// 植物类（模型块 + 无碰撞）
	...defineBlocks(
		[
			[BlockType.TallGrassBlock, "高草", { growable: { maxStage: 2 } }],
			[BlockType.RedFlowerBlock, "红花", { modelPath: "" }],
			[BlockType.PurpleFlowerBlock, "紫花", { modelPath: "" }],
			[BlockType.WhiteFlowerBlock, "白花", { modelPath: "" }],
			[BlockType.RyeBlock, "黑麦", { growable: { maxStage: 8 } }],
			[BlockType.CottonBlock, "棉花", { growable: { maxStage: 2 } }],
			[BlockType.DryBushBlock, "枯木", { modelPath: "" }],
			[BlockType.LargeDryBushBlock, "大型枯木", { modelPath: "" }],
		],
		plantBlock
	),

	// 模型类
	[BlockType.CactusBlock]: modelBlock("仙人掌", ""),
	[BlockType.CraftTableBlock]: modelBlock("工作台", ""),
};

export default blockData;
