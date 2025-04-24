import {
    Color3,
    StandardMaterial,
    Texture,
    Scene,
    Vector3,
    Vector4,
    Mesh,
    AbstractMesh,
    ImportMeshAsync, TransformNode, MeshBuilder, Color4
} from "@babylonjs/core";
import {Blocks, getBlocksKey} from "@/enums/Blocks.ts";
import {Assets, getBlockModel} from "@/enums/Assets.ts";
import BlockMeshBuilder, {FaceType} from "@/game-root/utils/BlockMeshBuilder.ts";
import {MaterialManager} from "@/game-root/utils/MaterialManager.ts";

interface BlockProps {
    scene: Scene;
    blockType: Blocks;
    position: Vector3;
    isTransparent?: boolean
}

export abstract class Block {
    readonly scene: Scene;
    readonly blockType: Blocks;
    readonly position: Vector3;
    readonly isTransparent: boolean;

    protected constructor(
        {scene, blockType, position, isTransparent}: BlockProps
    ) {
        this.scene = scene;
        this.blockType = blockType;
        this.position = position;
        this.isTransparent = isTransparent ?? false;
    }

    abstract render(faces?: Partial<Record<FaceType, boolean>>): void;

    abstract renderIcon(): void;

    abstract dispose(): void;
}

export abstract class TextureBlock extends Block {
    static texturePath: string = Assets.blocksTexture;
    uv: Vector4[];
    static materialCache: Map<string, StandardMaterial> = new Map(); // 静态材质缓存
    static textureCache: Map<string, Texture> = new Map();           // 纹理缓存
    mesh: Mesh | undefined;

    protected constructor(props: BlockProps & {
        uv: Vector4[]
    }) {
        super(props);
        this.uv = props.uv;
    }

    protected _createMesh(texturePath: string, {faces, noCache}: {
        faces?: Partial<Record<FaceType, boolean>>,
        noCache?: boolean
    }) {
        const mesh = BlockMeshBuilder.createBlockMesh(this.blockType, {
            faceUV: this.uv,
            faces,
        }, this.scene);
        // 启用边缘渲染，用于鼠标悬浮显示边框
        mesh.enableEdgesRendering();
        mesh.edgesRenderer!.isEnabled = false; // 默认先关闭，否则会显示红色边框
        // 开启碰撞
        mesh.checkCollisions = true;
        mesh.material = MaterialManager.getBlockMaterial({
            scene: this.scene, blockType: this.blockType, texturePath, noCache
        });
        mesh.position = this.position;
        return mesh;
    }

    render(faces?: Partial<Record<FaceType, boolean>>) {
        this.dispose(); // 必须先清除原来的再重新渲染
        this.mesh = this._createMesh(TextureBlock.texturePath, {faces});
    }

    renderIcon() {
        this._createMesh(TextureBlock.texturePath, {
            faces: {front: true, right: true, top: true},
            // 渲染icon不能使用缓存，因为缓存保存在了主场景中，图标生成使用的是临时的场景，两个场景不一致会获取不到
            noCache: true,
        });
    }

    dispose() {
        this.mesh?.dispose();
    }
}

// 拓展纹理方块
export abstract class ModTextureBlock extends TextureBlock {
    static texturePath: string = Assets.blocksTexture; // 修改一下纹理路径即可
    override render(faces?: Partial<Record<FaceType, boolean>>) {
        this.dispose();
        this.mesh = this._createMesh(ModTextureBlock.texturePath, {faces});
    }

    override renderIcon() {
        this._createMesh(ModTextureBlock.texturePath, {
            faces: {front: true, right: true, top: true},
            noCache: true
        });
    }
}

export abstract class ModelBlock extends Block {
    modelPath: string;
    mesh: TransformNode | undefined;
    material: StandardMaterial | undefined;

    protected constructor(
        props: BlockProps,
        modelPath?: string
    ) {
        super(props);
        this.modelPath = modelPath ?? getBlockModel(getBlocksKey(props.blockType));
    }

    abstract setMaterial(mesh: AbstractMesh, config: { noCache: boolean }): void;

    async loadModel(scene: Scene, config: { noCache: boolean }) {
        let modelKey: string = `${this.blockType}Model`;
        const {meshes} = await ImportMeshAsync(this.modelPath, scene);

        // 1. 创建模型节点并组合子 mesh
        const node = new TransformNode(modelKey, scene);
        for (const mesh of meshes.filter(mesh => mesh.name != "__root__")) {
            mesh.isPickable = false;
            mesh.setParent(node);
            this.setMaterial(mesh, config);
        }

        // 2. 创建外部碰撞盒
        const collider = MeshBuilder.CreateBox(`${modelKey}Collider`, {
            size: 1
        }, scene);
        // 创建透明材质并应用到 collider
        const transparentMaterial = new StandardMaterial(`${modelKey}TransparentMat`, scene);
        transparentMaterial.alpha = 0; // 设置材质的透明度为 0，使得面不可见

        collider.material = transparentMaterial;
        collider.checkCollisions = true;
        collider.isPickable = true;
        collider.enableEdgesRendering();
        collider.edgesRenderer!.isEnabled = false; // 默认隐藏边框

        // 设置父子关系
        node.parent = collider;

        // 再设置 collider 的最终位置（此时 node 会跟着移动）
        collider.position = this.position.add(new Vector3(0.5, 0.5, 0.5)); // 注意加 y 偏移，模型居中
        // 设置模型的相对位置，让它贴地面
        node.position = new Vector3(0, -0.5, 0);

        return collider;
    }

    async render() {
        const node = await this.loadModel(this.scene, {noCache: false});
        this.mesh = node;
    }

    async renderIcon() {
        await this.loadModel(this.scene, {noCache: true});
    }

    dispose(): void {
        this.mesh?.dispose();
    }
}