import {
    Engine,
    Scene,
    ArcRotateCamera,
    Vector3,
    HemisphericLight,
    Color4, Camera, Light,
} from "@babylonjs/core";
import { BlockIconStore } from "@/block-icon/store.ts";
import {Block} from "@/blocks/core/Block.ts";

let engine: Engine;
let scene: Scene;
let canvas: HTMLCanvasElement;
let camera: ArcRotateCamera;

function setupScene(): void {
    canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    engine = new Engine(canvas, false);

    scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0);

    camera = new ArcRotateCamera("Camera", Math.PI / 4, Math.atan(Math.sqrt(2)), 3, Vector3.Zero(), scene);

    // 启用正交投影
    camera.mode = Camera.ORTHOGRAPHIC_CAMERA;

    // 设置正交参数（越大越远，越小越近，建议适当调试）
    const halfSize = 1; // 取决于你图标里方块的实际大小
    camera.orthoLeft = -halfSize;
    camera.orthoRight = halfSize;
    camera.orthoTop = halfSize;
    camera.orthoBottom = -halfSize;

    camera.attachControl(canvas, false);

}

async function generateBlockIcon(BlockClass: any): Promise<Blob> {
    // 清空上一次的 block
    for (const mesh of scene.meshes) {
        if (mesh.name !== "Camera") mesh.dispose();
    }

    const block = new BlockClass(scene,Vector3.Zero()) as Block;

    block.renderIcon();

    await new Promise<void>((resolve) => {
        scene.executeWhenReady(resolve);
    });

    scene.render();

    return await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/webp");
    });
}

export async function generateAllBlockIcons(): Promise<void> {
    const modules: Record<string, any> = import.meta.glob("/src/blocks/**/*.ts", { eager: true });

    // 过滤出需要生成图标的 BlockClass
    const iconRequiredBlocks = Object.entries(modules).filter(([_, mod]) => {
        const BlockClass = mod.default;
        return BlockClass && BlockClass.__isEntityBlock;
    });

    const iconCount = await BlockIconStore.count();

    if (iconCount !== iconRequiredBlocks.length) {
        console.info(`[BlockIconStore] 正在重新构建 (${iconCount} / ${iconRequiredBlocks.length})`);
    } else {
        console.info(`[BlockIconStore] 使用缓存`);
        return;
    }

    setupScene();

    // 跳过已经存在的icon
    for (const [_, mod] of iconRequiredBlocks) {
        const BlockClass = mod.default;
        const iconName = BlockClass.__blockType;
        if(await BlockIconStore.get(iconName))
            continue;
        const blob = await generateBlockIcon(BlockClass);
        await BlockIconStore.set(iconName, blob);
    }

    engine.dispose();
}

