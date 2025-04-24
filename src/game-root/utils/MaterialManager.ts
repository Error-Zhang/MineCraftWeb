import {Color3, Scene, StandardMaterial, Texture} from "@babylonjs/core";
import {Blocks} from "@/enums/Blocks.ts";

export class MaterialManager {
    private static textureCache: Map<string, Texture> = new Map();
    private static materialCache: Map<string, StandardMaterial> = new Map();

    /**
     * 获取（或创建）材质
     * @param scene Babylon 场景
     * @param texturePath 纹理路径
     * @param materialKey 缓存键名（通常与 Block 类型或模型类型相关）
     */
    static getBlockMaterial({scene, texturePath, blockType,noCache = false}: {
        scene: Scene,
        texturePath: string,
        blockType: Blocks,
        noCache?:boolean
    }): StandardMaterial {
        let texture: Texture;
        const materialKey = `${blockType}Material`;
        if (noCache || !this.textureCache.has(texturePath)) {
            /**
             * 3：是否禁用mipmap
             * 4：反转纹理的 v 轴方向, 改成从左上角开始，或者使用texture.vScale = -1;
             * 5：采样方法：NEAREST_NEAREST禁用模糊插值，直接精确采样像素
             */
            texture = new Texture(texturePath, scene, true, false, Texture.NEAREST_NEAREST_MIPLINEAR);
            // 防止边框出现白线
            texture.wrapU = Texture.CLAMP_ADDRESSMODE;
            texture.wrapV = Texture.CLAMP_ADDRESSMODE;
            // 注意要在不要在不使用缓存的情况下设置缓存
            !noCache && this.textureCache.set(texturePath, texture);

        } else {
            texture = this.textureCache.get(texturePath)!;
        }

        if (noCache|| !this.materialCache.has(materialKey) ) {
            const material = new StandardMaterial(materialKey, scene);
            material.diffuseTexture = texture;
            material.disableLighting = true;
            material.emissiveColor = new Color3(1, 1, 1); // 让材质本身发光
            !noCache && this.materialCache.set(materialKey, material);
            return material;
        } else {
            return this.materialCache.get(materialKey)!;

        }
    }

    static clearCache() {
        this.textureCache.clear();
        this.materialCache.clear();
    }
}
