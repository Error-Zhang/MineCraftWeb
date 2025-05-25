import { Color3, Material, Scene, ShaderMaterial, StandardMaterial, Texture } from "@babylonjs/core";

/** 材质文档
 * https://doc.babylonjs.com/features/featuresDeepDive/materials/
 */

export interface MaterialConfig {
	textureKey?: string;
	color?: Color3;
	emissive?: Color3;
	specular?: Color3;
	roughness?: number;
	alpha?: number;
	backFaceCulling?: boolean;
	customShader?: {
		vertex: string;
		fragment: string;
		uniforms?: Record<string, any>;
	};
	meshProperties?: {
		isPickable?: boolean;
		checkCollisions?: boolean;
		isVisible?: boolean;
	};
	shadowProperties?: any;
}

export class BlockTextureManager {
	public static textureCache: Map<string, Texture> = new Map();

	static registerTextures(scene: Scene, textures: { key: string; path: string }[]) {
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

	static getTexture(key?: string): Texture {
		if (!key) key = Array.from(this.textureCache.keys())[0];
		let texture = this.textureCache.get(key);
		if (!texture) throw new Error(`Texture not found: ${key}`);
		return texture;
	}
}

export class BlockMaterialManager {
	// 预设材质类型
	static readonly PRESET_MATERIALS = {
		SOLID: "solid",
		TRANSPARENT: "transparent",
		WATER: "water",
		LAVA: "lava",
		LEAVES: "leaves",
		GLASS: "glass",
		CROSS: "cross",
		CUSTOM: "custom",
	} as const;
	private static materialCache: Map<string, Material> = new Map();
	private static materialPresets: Map<string, MaterialConfig> = new Map();

	// 初始化预设材质
	static initializePresetMaterials() {
		// 固体方块材质
		this.registerMaterialPreset(this.PRESET_MATERIALS.SOLID, {
			alpha: 1,
			backFaceCulling: true,
			roughness: 0.7,
			meshProperties: {
				isPickable: true,
				checkCollisions: true,
				isVisible: true,
			},
		});

		// 透明方块材质
		this.registerMaterialPreset(this.PRESET_MATERIALS.TRANSPARENT, {
			alpha: 0.5,
			backFaceCulling: true,
			roughness: 0.3,
			meshProperties: {
				isPickable: true,
				checkCollisions: true,
				isVisible: true,
			},
		});

		// 水材质
		this.registerMaterialPreset(this.PRESET_MATERIALS.WATER, {
			alpha: 0.8,
			backFaceCulling: false,
			customShader: {
				vertex: "water",
				fragment: "water",
				uniforms: {
					waveHeight: 0.1,
					waveSpeed: 1.0,
				},
			},
			meshProperties: {
				isPickable: true,
				checkCollisions: false,
				isVisible: true,
			},
		});

		// 岩浆材质
		this.registerMaterialPreset(this.PRESET_MATERIALS.LAVA, {
			alpha: 0.9,
			backFaceCulling: false,
			customShader: {
				vertex: "lava",
				fragment: "lava",
				uniforms: {
					flowSpeed: 0.5,
					glowIntensity: 0.8,
				},
			},
			meshProperties: {
				isPickable: true,
				checkCollisions: false,
				isVisible: true,
			},
		});

		// 树叶材质
		this.registerMaterialPreset(this.PRESET_MATERIALS.LEAVES, {
			alpha: 0.9,
			backFaceCulling: false,
			roughness: 0.4,
			meshProperties: {
				isPickable: true,
				checkCollisions: false,
				isVisible: true,
			},
		});

		// 玻璃材质
		this.registerMaterialPreset(this.PRESET_MATERIALS.GLASS, {
			alpha: 0.3,
			backFaceCulling: false,
			roughness: 0.1,
			meshProperties: {
				isPickable: true,
				checkCollisions: true,
				isVisible: true,
			},
		});

		// 十字材质（用于植物等）
		this.registerMaterialPreset(this.PRESET_MATERIALS.CROSS, {
			alpha: 1,
			backFaceCulling: false,
			roughness: 0.8,
			meshProperties: {
				isPickable: true,
				checkCollisions: false,
				isVisible: true,
			},
		});
	}

	// 注册预设材质
	static registerMaterialPreset(key: string, config: MaterialConfig) {
		this.materialPresets.set(key, config);
	}

	// 获取预设材质
	static getMaterialPreset(key: string): MaterialConfig | undefined {
		return this.materialPresets.get(key);
	}

	// 创建材质
	static createMaterial(scene: Scene, config: MaterialConfig): Material {
		const {
			color = new Color3(1, 1, 1),
			emissive = new Color3(0, 0, 0),
			specular = new Color3(0.2, 0.2, 0.2),
			roughness = 0.5,
			textureKey,
			alpha = 1,
			backFaceCulling = true,
			customShader,
			meshProperties,
			shadowProperties,
		} = config;

		let material: Material;

		if (customShader) {
			const shaderMaterial = new ShaderMaterial(
				"customShaderMaterial",
				scene,
				{
					vertex: customShader.vertex,
					fragment: customShader.fragment,
				},
				{
					attributes: ["position", "normal", "uv"],
					uniforms: [
						"world",
						"worldView",
						"worldViewProjection",
						...Object.keys(customShader.uniforms || {}),
					],
				}
			);

			if (customShader.uniforms) {
				for (const [key, value] of Object.entries(customShader.uniforms)) {
					shaderMaterial.setFloat(key, value);
				}
			}

			const texture = BlockTextureManager.getTexture(textureKey);
			shaderMaterial.setTexture("diffuseSampler", texture);

			shaderMaterial.alpha = alpha;
			shaderMaterial.backFaceCulling = backFaceCulling;
			material = shaderMaterial;
		} else {
			const standardMaterial = new StandardMaterial("standardMaterial", scene);
			const texture = BlockTextureManager.getTexture(textureKey);
			standardMaterial.diffuseTexture = texture;
			standardMaterial.diffuseColor = color;
			standardMaterial.emissiveColor = emissive;
			standardMaterial.specularColor = specular;
			standardMaterial.roughness = roughness;
			standardMaterial.alpha = alpha;
			standardMaterial.backFaceCulling = backFaceCulling;
			material = standardMaterial;
		}

		// 存储网格属性和阴影属性到材质的元数据中
		(material as any).metadata = {
			meshProperties,
			shadowProperties,
		};

		return material;
	}

	// 获取材质（带缓存）
	static getMaterial(scene: Scene, key: string, config: MaterialConfig): Material {
		if (this.materialCache.has(key)) {
			return this.materialCache.get(key)!;
		}

		const material = this.createMaterial(scene, config);
		this.materialCache.set(key, material);
		return material;
	}

	// 根据材质键获取材质
	static getMaterialByKey(scene: Scene, matKey: string, textureKey: string = ""): Material {
		const presetConfig = this.getMaterialPreset(matKey);

		if (!presetConfig) {
			throw new Error(`No material preset found for key: ${matKey}`);
		}

		const config: MaterialConfig = {
			...presetConfig,
			textureKey,
		};

		return this.getMaterial(scene, `${textureKey}-${matKey}`, config);
	}

	// 注册自定义材质
	static registerCustomMaterial(key: string, config: MaterialConfig) {
		this.registerMaterialPreset(key, config);
	}

	// 清除材质缓存
	static clearCache() {
		this.materialCache.clear();
	}
}
