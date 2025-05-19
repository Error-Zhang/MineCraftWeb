import { Color3, Material, Scene, StandardMaterial, Texture } from "@babylonjs/core";
import { Blocks } from "@/blocks/core/Blocks.ts";

/** 材质文档
 * https://doc.babylonjs.com/features/featuresDeepDive/materials/
 */

/** 精灵图的使用方法
 * https://doc.babylonjs.com/features/featuresDeepDive/materials/using/texturePerBoxFace/
 */

type TextureKeyType = "blocks" | "mod-blocks";

export class BlockTextureManager {
	private static textureCache: Map<string, Texture> = new Map();

	static preloadTextures(scene: Scene, textures: { key: TextureKeyType; path: string }[]) {
		for (const { path, key } of textures) {
			if (!this.textureCache.has(path)) {
				/**
				 * 3：是否禁用mipmap(通过生成不同分辨率的图像来实现近处清晰远处模糊，进而优化性能)
				 * 4：反转纹理的 Y(V) 轴方向, 改成从左上角开始，或者使用texture.vScale = -1;
				 * 5：采样方法：最近点采样（nearest）NEAREST_NEAREST 或 NEAREST_NEAREST_MIPNEAREST (开启mipMap使用)直接精确采样像素防止模糊（mc首选）
				 */
				let texture = new Texture(path, scene, false, false, Texture.NEAREST_NEAREST_MIPNEAREST);
				// 防止边框出现白线(UV 坐标超出 0~1 范围时，取边缘像素的颜色)
				texture.wrapU = Texture.CLAMP_ADDRESSMODE;
				texture.wrapV = Texture.CLAMP_ADDRESSMODE;

				this.textureCache.set(key, texture);
			}
		}
	}

	static getTexture(key: TextureKeyType): Texture {
		let texture = this.textureCache.get(key);
		if (!texture) throw new Error("Texture not found");
		return texture;
	}

	/**
	 * 释放所有纹理资源
	 */
	static disposeAll() {
		for (const texture of this.textureCache.values()) {
			texture.dispose();
		}
		this.textureCache.clear();
	}
}

export enum TransparencyType {
	Opaque, // 完全不透明
	Cutout, // 树叶类，使用 alpha test
	Transparent, // 水、玻璃等，使用 alpha blend
}

type MaterialOptions = {
	scene: Scene;
	blockType: Blocks;
	alpha?: number;
	color?: Color3;
};

export class MaterialManager {
	private static materialCache: Map<string, Material> = new Map();

	static getOpaqueBlockMaterial(
		options: MaterialOptions,
		textureKey: TextureKeyType = "blocks"
	): Material {
		return this.getMaterial(options, TransparencyType.Opaque, textureKey);
	}

	static getCutoutBlockMaterial(
		options: MaterialOptions,
		textureKey: TextureKeyType = "blocks"
	): Material {
		return this.getMaterial(options, TransparencyType.Cutout, textureKey);
	}

	static getTransparentBlockMaterial(
		options: MaterialOptions,
		textureKey: TextureKeyType = "blocks"
	): Material {
		return this.getMaterial(options, TransparencyType.Transparent, textureKey);
	}

	static getMaterial(
		{ scene, blockType, alpha = 1, color = new Color3(1, 1, 1) }: MaterialOptions,
		transparencyType: TransparencyType,
		textureKey: TextureKeyType
	): Material {
		const matKey = `${blockType}-${color}`;
		if (this.materialCache.has(matKey)) {
			return this.materialCache.get(matKey)!;
		}

		const material = new StandardMaterial(matKey, scene);
		const texture = BlockTextureManager.getTexture(textureKey);
		material.diffuseTexture = texture;
		material.diffuseColor = color;
		switch (transparencyType) {
			case TransparencyType.Opaque:
				material.alpha = 1;
				material.backFaceCulling = true;
				break;

			case TransparencyType.Cutout:
				material.alpha = alpha;
				material.diffuseTexture.hasAlpha = true;
				material.transparencyMode = Material.MATERIAL_ALPHATEST;
				material.alphaCutOff = 0.5;
				material.backFaceCulling = true;
				break;

			case TransparencyType.Transparent:
				material.alpha = alpha;
				material.diffuseTexture.hasAlpha = true;
				material.transparencyMode = Material.MATERIAL_ALPHABLEND;
				material.backFaceCulling = true;
				break;
		}

		this.materialCache.set(matKey, material);
		return material;
	}
}

export class BlockMeshManager {}
