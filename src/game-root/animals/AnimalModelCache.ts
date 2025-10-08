import { AbstractMesh, ImportMeshAsync, PBRMaterial, Scene, Texture } from "@babylonjs/core";

import Assets from "@/game-root/assets";

/**
 * 动物纹理变体配置
 * 每种动物可以有多个纹理变体，随机选择一个
 */
const ANIMAL_TEXTURE_VARIANTS: Record<string, string[]> = {
	Cow: [Assets.animals.textures.Cow_Black, Assets.animals.textures.Cow_Brown],
	Bear: [Assets.animals.textures.Bear_Black, Assets.animals.textures.Bear_Brown],
	PolarBear: [Assets.animals.textures.Bear_Polar],
	Horse: [
		Assets.animals.textures.Horse_Bay,
		Assets.animals.textures.Horse_Black,
		Assets.animals.textures.Horse_Chestnut,
		Assets.animals.textures.Horse_Palomino,
		Assets.animals.textures.Horse_White,
	],
	Wolf: [Assets.animals.textures.Wolf_Gray, Assets.animals.textures.Wolf_Coyote],
	Tiger: [Assets.animals.textures.Tiger_Normal, Assets.animals.textures.Tiger_White],
	Shark_Bull: [Assets.animals.textures.Shark_Bull],
	Shark_GreatWhite: [Assets.animals.textures.Shark_GreatWhite],
	Shark_Tiger: [Assets.animals.textures.Shark_Tiger],
	// 单一纹理的动物
	Donkey: [Assets.animals.textures.Donkey],
	Camel: [Assets.animals.textures.Camel],
	Bison: [Assets.animals.textures.Bison],
	Zebra: [Assets.animals.textures.Zebra],
	Lion: [Assets.animals.textures.Lion],
	Leopard: [Assets.animals.textures.Leopard],
	Jaguar: [Assets.animals.textures.Jaguar],
	Hyena: [Assets.animals.textures.Hyena],
	Wildboar: [Assets.animals.textures.Wildboar],
	Giraffe: [Assets.animals.textures.Giraffe],
	Rhino: [Assets.animals.textures.Rhino],
	Moose: [Assets.animals.textures.Moose],
	Reindeer: [Assets.animals.textures.Reindeer],
	Sparrow: [Assets.animals.textures.Sparrow],
	Raven: [Assets.animals.textures.Raven],
	Seagull: [Assets.animals.textures.Seagull],
	Pigeon: [Assets.animals.textures.Pigeon],
	Cassowary: [Assets.animals.textures.Cassowary],
	Ostrich: [Assets.animals.textures.Ostrich],
	Duck: [Assets.animals.textures.Duck],
	Bass: [Assets.animals.textures.Bass_Freshwater, Assets.animals.textures.Bass_Sea],
	Barracuda: [Assets.animals.textures.Barracuda],
	Piranha: [Assets.animals.textures.Piranha],
	Orca: [Assets.animals.textures.Orca],
	Beluga: [Assets.animals.textures.Beluga],
	Ray: [Assets.animals.textures.Ray_Brown, Assets.animals.textures.Ray_Yellow],
	Werewolf: [Assets.animals.textures.Werewolf],
};

class AnimalModelCache {
	private static prototypes: Map<string, AbstractMesh> = new Map();
	private static instanceCounts: Map<string, number> = new Map();
	private static textureCache: Map<string, Texture> = new Map();

	static async instantiate(type: string, modelPath: string, scene: Scene) {
		let proto = this.prototypes.get(type);
		if (!proto) {
			const result = await ImportMeshAsync(modelPath, scene);
			proto = result.meshes[0];
			result.meshes.slice(1).forEach(m => {
				m.setEnabled(false);
			});
			this.prototypes.set(type, proto);
		}

		const instanceRoot: AbstractMesh = proto.clone(`${type}_inst`, null)!;

		const meshes = instanceRoot.getChildMeshes();

		meshes.forEach((m: AbstractMesh) => {
			m.isPickable = false;
			m.checkCollisions = false;
			m.renderingGroupId = 1;
			m.setEnabled(true);
		});
		return instanceRoot;
	}

	/**
	 * 获取动物模型
	 */
	static async getModel(type: string, scene: Scene): Promise<AbstractMesh> {
		const modelPath = Assets.animals.models[type as keyof typeof Assets.animals.models];
		if (!modelPath) {
			throw new Error(`[animalSystem] Cannot find model with type ${type}`);
		}
		const mesh = await this.instantiate(type, modelPath, scene);

		// 应用随机纹理
		const texturePath = this.getRandomTexture(type);
		if (texturePath) {
			this.applyTexture(mesh, texturePath, scene);
		}

		// 增加实例计数
		const count = this.instanceCounts.get(type) || 0;
		this.instanceCounts.set(type, count + 1);

		return mesh;
	}

	/**
	 * 释放模型
	 */
	static releaseModel(type: string, mesh: AbstractMesh): void {
		mesh.dispose();

		// 减少实例计数
		const count = this.instanceCounts.get(type) || 0;
		if (count > 0) {
			this.instanceCounts.set(type, count - 1);
		}
	}

	/**
	 * 清理未使用的原型
	 */
	static cleanup(): void {
		for (const [type, count] of this.instanceCounts.entries()) {
			if (count === 0) {
				const proto = this.prototypes.get(type);
				if (proto) {
					proto.dispose();
					this.prototypes.delete(type);
				}
				this.instanceCounts.delete(type);
			}
		}
	}

	/**
	 * 获取或创建纹理（带缓存）
	 */
	private static getTexture(texturePath: string, scene: Scene): Texture {
		let texture = this.textureCache.get(texturePath);
		if (!texture) {
			texture = new Texture(texturePath, scene);
			this.textureCache.set(texturePath, texture);
		}
		return texture;
	}

	/**
	 * 应用纹理到模型
	 */
	private static applyTexture(mesh: AbstractMesh, texturePath: string, scene: Scene): void {
		const childMeshes = mesh.getChildMeshes();

		for (const child of childMeshes) {
			if (child.material) {
				// 克隆材质以避免影响原型
				const material = child.material.clone(`${child.name}_mat`);

				// 从缓存获取或加载纹理
				const texture = this.getTexture(texturePath, scene);

				// 这里的模型使用的是物理材质
				(<PBRMaterial>material).albedoTexture = texture;
				child.material = material;
			}
		}
	}

	/**
	 * 随机选择纹理变体
	 */
	private static getRandomTexture(type: string): string | null {
		const variants = ANIMAL_TEXTURE_VARIANTS[type];
		if (!variants || variants.length === 0) return null;

		const randomIndex = Math.floor(Math.random() * variants.length);
		return variants[randomIndex];
	}
}

export default AnimalModelCache;
