import {
	AbstractMesh,
	Color3,
	ImportMeshAsync,
	InstancedMesh,
	Mesh,
	MeshBuilder,
	Scene,
	StandardMaterial,
	Texture,
	TransformNode,
	Vector3,
	Vector4,
} from "@babylonjs/core";
import { Blocks } from "@/blocks/core/Blocks.ts";
import { Assets } from "@/assets";
import BlockMeshBuilder, {
	FaceColors,
	Faces,
	FaceType,
	UVGrid,
} from "@/blocks/core/BlockMeshBuilder.ts";
import { BlockMaterialManager } from "@/blocks/core/BlockMaterialManager.ts";
import { BlockRecipe } from "@/blocks/core/BlockTypes.ts";
import { MaterialManager } from "@/blocks/core/BlockRenderManager.ts";

interface BlockProps {
	scene: Scene;
	position: Vector3;
}

export abstract class Block {
	static readonly __blockType: Blocks; // 在BlockEntity注解中自动生成
	static readonly maxCount: number = 40;
	static getRecipes?: () => Generator<BlockRecipe>;
	static readonly __isTransparent: boolean = false;
	static readonly __isCollision: boolean = true;
	static readonly __isAnimator: boolean = false;
	static readonly __isModelBlock: boolean = false;
	static readonly __isInteractable: boolean = false;
	readonly scene: Scene;
	readonly position: Vector3;
	readonly guid?: string;

	constructor(scene: Scene, position: Vector3) {
		this.scene = scene;
		this.position = position;
	}

	static get isSpecial(): boolean {
		return this instanceof ModelBlock || this.__isInteractable;
	}

	get isTransparent() {
		return (this.constructor as typeof Block).__isTransparent;
	}

	get blockType() {
		return (this.constructor as typeof Block).__blockType;
	}

	get isAnimator() {
		return (this.constructor as typeof Block).__isAnimator;
	}

	get isCollision() {
		return (this.constructor as typeof Block).__isCollision;
	}

	get isInteractable() {
		return (this.constructor as typeof Block).__isInteractable;
	}

	onInteract?(): void;

	onCreatedMesh?(): void;

	createMesh?(faces?: Faces): InstancedMesh | Mesh;

	abstract render(faces?: Faces): void;

	abstract tryRender(faces?: Faces): void;

	abstract setActive(active: boolean): void;

	abstract renderIcon(): void;

	abstract dispose(): void;
}

export abstract class TextureBlock extends Block {
	static texturePath: string = Assets.blocksTexture;
	static materialCache: Map<string, StandardMaterial> = new Map(); // 静态材质缓存
	static textureCache: Map<string, Texture> = new Map(); // 纹理缓存
	protected abstract uv: Vector4[];
	protected uvGrid?: UVGrid; // 控制动画的大网格
	protected mesh?: InstancedMesh | Mesh;
	protected faceColors?: FaceColors;
	protected color: Color3 = new Color3(1, 1, 1);
	private faces?: Faces;

	constructor(scene: Scene, position: Vector3) {
		super(scene, position);
	}

	// 会被大量调用，所以尽可能少的存储mesh
	override createMesh(faces?: Faces) {
		if (this.mesh && !this.isFaceChange(faces)) {
			return this.mesh;
		} else {
			this.dispose();
			this.mesh = this._createMesh(TextureBlock.texturePath, { faces });
			this.onCreatedMesh?.();
			return this.mesh;
		}
	}

	isFaceChange(faces?: Faces) {
		if (!faces && !this.faces) return false;
		if (faces && this.faces && Object.keys(this.faces).length === Object.keys(faces).length) {
			Object.entries(faces).forEach(([key, value]) => {
				if (!this.faces![key as FaceType]) return true;
			});
			return false;
		}
		return true;
	}

	override tryRender(faces?: Faces) {
		if (!this.mesh || this.isFaceChange(faces)) {
			this.render(faces);
		} else {
			this.setActive(true);
		}
	}

	override setActive(active: boolean) {
		this.mesh?.setEnabled(active);
	}

	override render(faces?: Faces, texturePath = TextureBlock.texturePath) {
		this.dispose();
		const mesh = this._createMesh(texturePath, { faces });
		this.faces = faces;
		this.mesh = mesh;
		this.onCreatedMesh?.();
		mesh.setEnabled(true);
	}

	override renderIcon(texturePath = TextureBlock.texturePath) {
		const mesh = this._createMesh(texturePath, {
			faces: { front: true, right: true, top: true },
			// 渲染icon不能使用缓存，因为缓存保存在了主场景中，图标生成使用的是临时的场景，两个场景不一致会获取不到
			noCache: true,
			isEmissive: true,
		});
		mesh.setEnabled(true);
	}

	dispose() {
		this.mesh?.dispose();
		delete this.mesh;
	}

	/**
	 * 默认是不透明方块的实现(适用于大部分方块，特殊方块需对该方法进行 override)
	 */
	getMaterial() {
		return MaterialManager.getOpaqueBlockMaterial({
			scene: this.scene,
			blockType: this.blockType,
		});
	}

	protected _createMesh(
		texturePath: string,
		{
			faces,
			...args
		}: {
			faces?: Faces;
			noCache?: boolean;
			isEmissive?: boolean;
		}
	) {
		const material = BlockMaterialManager.getBlockMaterial({
			scene: this.scene,
			blockType: this.blockType,
			texturePath,
			isTransparent: this.isTransparent,
			color: this.color,
			...args,
		});
		const mesh = BlockMeshBuilder.createBlockMesh(
			this.blockType.toString(),
			{
				faceUV: this.uv,
				faces,
				faceColors: this.faceColors,
				material,
				useInstanceMesh: false,
			},
			this.scene
		);
		// 开启碰撞
		this.isCollision && (mesh.checkCollisions = true);
		mesh.isPickable = true;

		mesh.position = this.position;
		mesh.setEnabled(false);
		return mesh;
	}
}

// 拓展纹理方块
export abstract class ModTextureBlock extends TextureBlock {
	static texturePath: string = Assets.blocksTexture; // 修改一下纹理路径即可
	override render(faces?: Faces) {
		super.render(faces, ModTextureBlock.texturePath);
	}

	override renderIcon() {
		super.renderIcon(ModTextureBlock.texturePath);
	}
}

export abstract class ModelBlock extends Block {
	static override __isTransparent: boolean = true;
	static override __isModelBlock = true;
	modelPath: string;
	mesh: TransformNode | undefined;

	protected constructor({ scene, position }: BlockProps, modelPath: string) {
		super(scene, position);
		this.modelPath = modelPath;
	}

	abstract setMaterial(mesh: AbstractMesh, config: any): void;

	async loadModel(scene: Scene, config: { noCache: boolean; isEmissive?: boolean }) {
		let modelKey: string = `${this.blockType}`;
		const { meshes } = await ImportMeshAsync(this.modelPath, scene);

		// 1. 创建模型节点并组合子 mesh
		const node = new TransformNode(modelKey, scene);
		for (const mesh of meshes.filter(mesh => mesh.name != "__root__")) {
			mesh.isPickable = false;
			mesh.setParent(node);
			this.setMaterial(mesh, config);
		}

		// 2. 创建外部碰撞盒
		const collider = MeshBuilder.CreateBox(
			`${modelKey}Collider`,
			{
				size: 1,
			},
			scene
		);
		// 创建透明材质并应用到 collider
		const transparentMaterial = new StandardMaterial(`${modelKey}`, scene);
		transparentMaterial.alpha = 0; // 设置材质的透明度为 0，使得面不可见

		collider.material = transparentMaterial;
		collider.checkCollisions = true;
		collider.isPickable = true;
		collider.visibility = 0;
		// 设置父子关系
		node.parent = collider;

		// 再设置 collider 的最终位置（此时 node 会跟着移动）
		collider.position = this.position.add(new Vector3(0.5, 0.5, 0.5)); // 注意加 y 偏移，模型居中
		// 设置模型的相对位置，让它贴地面
		node.position = new Vector3(0, -0.5, 0);

		return collider;
	}

	async render() {
		this.dispose();
		const mesh = await this.loadModel(this.scene, { noCache: false });
		this.mesh = mesh;
	}

	tryRender() {
		if (this.mesh) {
			this.setActive(true);
		} else {
			this.render();
		}
	}

	override setActive(active: boolean) {
		this.mesh?.setEnabled(active);
	}

	async renderIcon() {
		await this.loadModel(this.scene, { noCache: true, isEmissive: true });
	}

	dispose(): void {
		this.mesh?.dispose();
	}
}
