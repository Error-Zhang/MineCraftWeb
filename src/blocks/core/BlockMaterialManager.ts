import { Color3, Material, Scene, StandardMaterial, Texture } from "@babylonjs/core";
import { Blocks } from "@/blocks/core/Blocks.ts";

interface BlockMaterialProps {
	scene: Scene;
	texturePath: string;
	blockType: Blocks;
	isTransparent?: boolean;
	isEmissive?: boolean;
	noCache?: boolean;
	color?: Color3;
}

export class BlockMaterialManager {
	private static textureCache: Map<string, Texture> = new Map();
	private static materialCache: Map<string, Material> = new Map();

	/**
	 * 获取（或创建）材质
	 * @param scene Babylon 场景
	 * @param texturePath 纹理路径
	 * @param materialKey 缓存键名（通常与 Block 类型或模型类型相关）
	 */
	static getBlockMaterial(props: BlockMaterialProps): Material {
		const {
			scene,
			texturePath,
			blockType,
			isTransparent = false,
			isEmissive = false,
			noCache = false,
			color = new Color3(1, 1, 1),
		} = props;
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

		if (noCache || !this.materialCache.has(materialKey)) {
			let material;
			if (blockType === Blocks.Water) {
				material = this.createWaterMaterial(props, materialKey, texture);
			} else {
				material = this.createStandardMaterial(props, materialKey, texture);
			}
			isEmissive && (material.emissiveColor = color); // 让材质本身发光,用于生成图标,,
			!noCache && this.materialCache.set(materialKey, material);
			return material;
		} else {
			return this.materialCache.get(materialKey)!;
		}
	}

	static createStandardMaterial(
		{ scene, isTransparent, color = new Color3(1, 1, 1) }: BlockMaterialProps,
		materialKey: string,
		texture: Texture
	): StandardMaterial {
		const material = new StandardMaterial(materialKey, scene);
		material.diffuseTexture = texture;
		material.diffuseColor = color; // 设置颜色
		isTransparent && (material.diffuseTexture.hasAlpha = true); // 告诉引擎改纹理为透明
		return material;
	}

	static createWaterMaterial(
		{ scene, color = new Color3(1, 1, 1) }: BlockMaterialProps,
		materialKey: string,
		texture: Texture
	) {
		const material = new StandardMaterial(materialKey, scene);
		const waterTexture = texture;
		material.diffuseTexture = waterTexture;
		material.diffuseColor = color;
		material.alpha = 0.5; // 半透明
		material.specularColor = new Color3(0.1, 0.1, 0.3); // 柔和的高光，像水的反光

		return material;
	}

	static clearCache() {
		this.textureCache.clear();
		this.materialCache.clear();
	}
}
