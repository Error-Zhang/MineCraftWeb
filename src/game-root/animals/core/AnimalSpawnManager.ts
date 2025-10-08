import { Vector3 } from "@babylonjs/core";
import { WorldController } from "@engine/core/WorldController";
import { AnimalEntity } from "../AnimalEntity.ts";
import { AnimalType, SpawnLocationType } from "./types";
import { BiomeAnalyzer } from "./BiomeAnalyzer";

export interface SpawnChunk {
	x: number;
	z: number;
	isSpawned: boolean;
	lastVisitedTime?: number;
	spawnedAnimals: number[];
}

export interface AnimalSpawnRule {
	animalType: AnimalType;
	spawnLocationType: SpawnLocationType;
	randomSpawn: boolean;
	constantSpawn: boolean;
	spawnSuitabilityFunction: (position: Vector3, biome: any) => number;
	spawnFunction: (position: Vector3, biome: any) => AnimalType[];
	maxCount?: number;
	spawnProbability?: number;
}

/**
 * 动物生成管理系统 - 基于生存战争架构
 * 负责管理动物的生成、区块管理和种群控制
 */
export class AnimalSpawnManager {
	private spawnChunks = new Map<string, SpawnChunk>();
	private animals = new Map<number, AnimalEntity>();
	private spawnRules = new Map<AnimalType, AnimalSpawnRule>();
	private biomeAnalyzer: BiomeAnalyzer;

	// 生成限制常量
	private readonly TOTAL_LIMIT = 26;
	private readonly AREA_LIMIT = 3;
	private readonly AREA_RADIUS = 16;
	private readonly CONSTANT_TOTAL_LIMIT = 6;
	private readonly SPAWN_RADIUS = 48;
	private readonly DESPAWN_RADIUS = 60;
	private readonly VISITED_RADIUS = 8;

	private lastUpdateTime = 0;
	private nextSpawnTime = 0;
	private nextDespawnTime = 0;

	constructor(
		private worldController: WorldController,
		private onAnimalSpawn: (animal: AnimalEntity) => void,
		private onAnimalDespawn: (animalId: number) => void
	) {
		this.biomeAnalyzer = new BiomeAnalyzer(worldController);
		this.initializeSpawnRules();
	}

	/**
	 * 更新动物生成系统
	 */
	public update(deltaTime: number, playerPositions: Vector3[]) {
		this.lastUpdateTime += deltaTime;

		// 更新访问时间
		this.updateVisitedChunks(playerPositions);

		// 定期生成动物
		if (this.lastUpdateTime >= this.nextSpawnTime) {
			this.nextSpawnTime = this.lastUpdateTime + this.getSpawnInterval();
			this.trySpawnAnimals(playerPositions);
		}

		// 定期清理远离的动物
		if (this.lastUpdateTime >= this.nextDespawnTime) {
			this.nextDespawnTime = this.lastUpdateTime + 2000; // 2秒检查一次
			this.despawnDistantAnimals(playerPositions);
		}

		// 清理旧区块
		this.cleanupOldChunks();
	}

	/**
	 * 获取所有动物
	 */
	public getAnimals(): AnimalEntity[] {
		return Array.from(this.animals.values());
	}

	/**
	 * 获取动物实体
	 */
	public getAnimal(id: number): AnimalEntity | undefined {
		return this.animals.get(id);
	}

	/**
	 * 手动在指定位置生成动物（用于调试或特殊需求）
	 */
	public forceSpawn(animalType: AnimalType, position: Vector3): AnimalEntity | null {
		if (this.getTotalAnimalCount() >= this.TOTAL_LIMIT) {
			return null;
		}

		const animal = this.createAnimal(animalType, position);
		if (animal) {
			this.animals.set(animal.id, animal);
			this.onAnimalSpawn(animal);
		}
		return animal;
	}

	/**
	 * 清理所有动物
	 */
	public dispose() {
		for (const animal of this.animals.values()) {
			this.onAnimalDespawn(animal.id);
		}
		this.animals.clear();
		this.spawnChunks.clear();
	}

	/**
	 * 初始化动物生成规则
	 */
	private initializeSpawnRules() {
		// 奶牛
		this.addSpawnRule({
			animalType: AnimalType.Cow,
			spawnLocationType: SpawnLocationType.Surface,
			randomSpawn: false,
			constantSpawn: false,
			maxCount: 4,
			spawnProbability: 0.05,
			spawnSuitabilityFunction: (pos, biome) => {
				const { temperature, humidity, distanceToWater } = biome;
				return temperature > 8 && humidity > 4 && distanceToWater > 20 ? 0.8 : 0;
			},
			spawnFunction: (pos, biome) => {
				const count = Math.floor(Math.random() * 3) + 2; // 2-4只
				return Array(count).fill(AnimalType.Cow);
			},
		});

		// 野猪
		this.addSpawnRule({
			animalType: AnimalType.Wildboar,
			spawnLocationType: SpawnLocationType.Surface,
			randomSpawn: false,
			constantSpawn: false,
			maxCount: 1,
			spawnProbability: 0.06,
			spawnSuitabilityFunction: (pos, biome) => {
				const { temperature, humidity, forestDensity } = biome;
				return temperature > 6 && humidity > 6 && forestDensity > 0.3 ? 0.7 : 0;
			},
			spawnFunction: (pos, biome) => {
				const count = Math.floor(Math.random() * 2) + 1; // 1-2只
				return Array(count).fill(AnimalType.Wildboar);
			},
		});
	}

	private addSpawnRule(rule: AnimalSpawnRule) {
		this.spawnRules.set(rule.animalType, rule);
	}

	/**
	 * 获取生成间隔（毫秒）
	 */
	private getSpawnInterval(): number {
		// 根据季节调整生成间隔

		return 60000; // 冬季120秒，其他季节60秒
	}

	/**
	 * 更新已访问的区块
	 */
	private updateVisitedChunks(playerPositions: Vector3[]) {
		const currentTime = Date.now();

		for (const playerPos of playerPositions) {
			const chunkX = Math.floor(playerPos.x / 16);
			const chunkZ = Math.floor(playerPos.z / 16);

			// 标记玩家周围的区块为已访问
			for (let dx = -this.VISITED_RADIUS; dx <= this.VISITED_RADIUS; dx++) {
				for (let dz = -this.VISITED_RADIUS; dz <= this.VISITED_RADIUS; dz++) {
					const key = `${chunkX + dx},${chunkZ + dz}`;
					let chunk = this.spawnChunks.get(key);
					if (!chunk) {
						chunk = {
							x: chunkX + dx,
							z: chunkZ + dz,
							isSpawned: false,
							spawnedAnimals: [],
						};
						this.spawnChunks.set(key, chunk);
					}
					chunk.lastVisitedTime = currentTime;
				}
			}
		}
	}

	/**
	 * 尝试生成动物
	 */
	private trySpawnAnimals(playerPositions: Vector3[]) {
		if (this.getTotalAnimalCount() >= this.TOTAL_LIMIT) {
			return; // 达到总数限制
		}

		for (const playerPos of playerPositions) {
			this.spawnAroundPlayer(playerPos);
		}
	}

	/**
	 * 在玩家周围生成动物
	 */
	private spawnAroundPlayer(playerPos: Vector3) {
		const chunkX = Math.floor(playerPos.x / 16);
		const chunkZ = Math.floor(playerPos.z / 16);
		const spawnRadius = Math.floor(this.SPAWN_RADIUS / 16);

		for (let dx = -spawnRadius; dx <= spawnRadius; dx++) {
			for (let dz = -spawnRadius; dz <= spawnRadius; dz++) {
				const distance = Math.sqrt(dx * dx + dz * dz);
				if (distance > spawnRadius) continue;

				const key = `${chunkX + dx},${chunkZ + dz}`;
				const chunk = this.spawnChunks.get(key);

				if (!chunk || chunk.isSpawned) continue;

				// 检查区域动物数量限制
				if (this.getAreaAnimalCount(chunkX + dx, chunkZ + dz) >= this.AREA_LIMIT) {
					continue;
				}

				this.spawnInChunk(chunk);
			}
		}
	}

	/**
	 * 在指定区块生成动物
	 */
	private spawnInChunk(chunk: SpawnChunk) {
		const centerX = chunk.x * 16 + 8;
		const centerZ = chunk.z * 16 + 8;

		// 尝试多个生成点
		for (let attempt = 0; attempt < 10; attempt++) {
			const x = centerX + (Math.random() - 0.5) * 16;
			const z = centerZ + (Math.random() - 0.5) * 16;
			const y = this.worldController.getColumnHeight(Math.floor(x), Math.floor(z)) + 1;

			const spawnPos = new Vector3(x, y, z);
			const biome = this.biomeAnalyzer.analyzeBiome(spawnPos);

			// 检查所有生成规则
			for (const [animalType, rule] of this.spawnRules) {
				const suitability = rule.spawnSuitabilityFunction(spawnPos, biome);

				if (suitability > 0 && Math.random() < rule.spawnProbability!) {
					const animalsToSpawn = rule.spawnFunction(spawnPos, biome);

					for (const animalType of animalsToSpawn) {
						if (this.getTotalAnimalCount() >= this.TOTAL_LIMIT) break;

						const animal = this.createAnimal(animalType, spawnPos);
						if (animal) {
							chunk.spawnedAnimals.push(animal.id);
							this.animals.set(animal.id, animal);
							this.onAnimalSpawn(animal);
						}
					}

					chunk.isSpawned = true;
					return; // 成功生成后退出
				}
			}
		}
	}

	/**
	 * 创建动物实体
	 */
	private createAnimal(animalType: AnimalType, position: Vector3): AnimalEntity | null {
		try {
			const id = this.generateAnimalId();
			const animal = new AnimalEntity(null as any, id, animalType);
			animal.setPosition(position.x, position.y, position.z);
			return animal;
		} catch (error) {
			console.error("Failed to create animal:", error);
			return null;
		}
	}

	/**
	 * 清理远离玩家的动物
	 */
	private despawnDistantAnimals(playerPositions: Vector3[]) {
		const animalsToRemove: number[] = [];

		for (const [id, animal] of this.animals) {
			let isNearPlayer = false;

			for (const playerPos of playerPositions) {
				const distance = Vector3.Distance(animal.getPosition(), playerPos);
				if (distance <= this.DESPAWN_RADIUS) {
					isNearPlayer = true;
					break;
				}
			}

			if (!isNearPlayer) {
				animalsToRemove.push(id);
			}
		}

		for (const id of animalsToRemove) {
			this.despawnAnimal(id);
		}
	}

	/**
	 * 移除动物
	 */
	private despawnAnimal(animalId: number) {
		const animal = this.animals.get(animalId);
		if (animal) {
			this.animals.delete(animalId);
			this.onAnimalDespawn(animalId);

			// 从区块记录中移除
			for (const chunk of this.spawnChunks.values()) {
				const index = chunk.spawnedAnimals.indexOf(animalId);
				if (index >= 0) {
					chunk.spawnedAnimals.splice(index, 1);
					break;
				}
			}
		}
	}

	/**
	 * 清理旧区块
	 */
	private cleanupOldChunks() {
		const currentTime = Date.now();
		const maxAge = 76800000; // 21.33小时
		const chunksToRemove: string[] = [];

		for (const [key, chunk] of this.spawnChunks) {
			if (!chunk.lastVisitedTime || currentTime - chunk.lastVisitedTime > maxAge) {
				// 清理该区块的动物
				for (const animalId of chunk.spawnedAnimals) {
					this.despawnAnimal(animalId);
				}
				chunksToRemove.push(key);
			}
		}

		for (const key of chunksToRemove) {
			this.spawnChunks.delete(key);
		}
	}

	/**
	 * 获取总动物数量
	 */
	private getTotalAnimalCount(): number {
		return this.animals.size;
	}

	/**
	 * 获取指定区域的动物数量
	 */
	private getAreaAnimalCount(chunkX: number, chunkZ: number): number {
		let count = 0;
		const radius = Math.floor(this.AREA_RADIUS / 16);

		for (let dx = -radius; dx <= radius; dx++) {
			for (let dz = -radius; dz <= radius; dz++) {
				const key = `${chunkX + dx},${chunkZ + dz}`;
				const chunk = this.spawnChunks.get(key);
				if (chunk) {
					count += chunk.spawnedAnimals.length;
				}
			}
		}

		return count;
	}

	/**
	 * 生成唯一动物ID
	 */
	private generateAnimalId(): number {
		return Date.now() + Math.floor(Math.random() * 1000);
	}
}
