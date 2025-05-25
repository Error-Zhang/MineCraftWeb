import { Scene, TransformNode, Vector3, Vector4 } from "@babylonjs/core";

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
	Transparent = "transparent"
}

export interface MaterialOptions {
	color?: [number, number, number];
	emissive?: [number, number, number];
	specular?: [number, number, number];
	roughness?: number;
	metallic?: number;
	textureKey?: string;
}

export interface MeshProperties {
	isPickable?: boolean;      // 是否可拾取
	checkCollisions?: boolean;  // 是否检查碰撞
	isVisible?: boolean;       // 是否可见
	isCollision?: boolean;     // 是否参与碰撞
}

export interface RenderMaterial {
	matKey: string;  // 材质键，用于标识和合并相同材质的方块
	textureKey?: string;
	color?: [number, number, number];
	emissive?: [number, number, number];
	specular?: [number, number, number];
	roughness?: number;
	metallic?: number;
	alpha?: number;
	backFaceCulling?: boolean;
	meshProperties?: MeshProperties;
}

export interface BlockOptions {
	properties?: Partial<BlockProperties>;
	tags?: string[];
	materialOptions?: MaterialOptions;
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
	uvs: Vector4[];
	loadModel: (
		scene: Scene,
		position: Vector3,
		properties: BlockProperties
	) => Promise<TransformNode>;
	materialOptions?: MaterialOptions;
}

export interface BlockBehavior {
	onTick?: () => void;
	onInteract?: () => void;
	onPlace?: () => void;
	onDestroy?: () => void;
}

export interface BlockDefinition<TMeta extends Record<string, any>> {
	id?: number;
	name: string;
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
