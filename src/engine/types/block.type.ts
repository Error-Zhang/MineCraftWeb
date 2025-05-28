import { Color3, Color4, Scene, TransformNode, Vector3, Vector4 } from "@babylonjs/core";

export interface BlockProperties {
	isBreakable?: boolean;
	hardness?: number;
	growthStage?: number;
	maxGrowthStage?: number;
	material?: RenderMaterial;
}

export enum TransparencyType {
	Opaque = "opaque",
	Cutout = "cutout",
	Transparent = "transparent",
}

export interface MeshProperties {
	isPickable?: boolean; // 是否可拾取
	checkCollisions?: boolean; // 是否检查碰撞
	isVisible?: boolean; // 是否可见
}

export interface RenderMaterial {
	matKey: string; // 材质键，用于标识和合并相同材质的方块
	textureKey?: string;
	color?: Color3;
	surfaceColor?: Color4;
	emissive?: Color3;
	specular?: Color3;
	roughness?: number;
	metallic?: number;
	alpha?: number;
	backFaceCulling?: boolean;
	meshProperties?: MeshProperties;
}

export type RenderComponent = CubeRender | CrossRender | ModelRender;

export interface CubeRender {
	type: "cube";
	uvs: Vector4[];
	transparencyType: TransparencyType;
	material: RenderMaterial;
}

export interface CrossRender {
	type: "cross";
	uvs: Vector4[];
	uvIndex: number;
	material: RenderMaterial;
}

export interface ModelRender {
	type: "model";
	uvs?: Vector4[]; // model本身自带uv
	loadModel: (scene: Scene, position: Vector3) => Promise<TransformNode>;
}

export interface BlockBehavior {
	onTick?: () => void;
	onInteract?: () => void;
	onPlace?: () => void;
	onDestroy?: () => void;
}

export interface BlockDefinition<TMeta extends Record<string, any>> {
	id?: number;
	blockType: string;
	tags: string[];
	properties?: Partial<BlockProperties>;

	render: RenderComponent;
	behavior?: BlockBehavior;
	createEntity?: () => BlockEntity;

	metaData: TMeta;
}

export interface BlockEntity {
	tick?(): void;

	serialize(): any;

	deserialize(data: any): void;
}
