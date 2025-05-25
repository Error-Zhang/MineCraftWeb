import { ChunkManager } from "../chunk/ChunkManager.ts";
import { BlockRegistry } from "../block/BlockRegistry.ts";
import { Position } from "../types/chunk.type.ts";
import Sky from "@engine/environment/Sky.ts";

export class WorldController {
	private lastUpdatePos?: { x: number; z: number };
	private lastSkyPos?: { x: number; z: number };

	constructor(
		public chunkManager: ChunkManager,
		public sky: Sky
	) {}

	/**
	 * 根据玩家位置更新区块和天空
	 * @param playerX 玩家 X 坐标
	 * @param playerZ 玩家 Z 坐标
	 */
	async updateChunk(playerX: number, playerZ: number) {
		const shouldUpdateSky =
			!this.lastSkyPos ||
			Math.max(Math.abs(playerX - this.lastSkyPos.x), Math.abs(playerZ - this.lastSkyPos.z)) >
				Sky.MinUpdateDistance;

		if (shouldUpdateSky) {
			this.sky.updatePosition(playerX, playerZ);
			this.lastSkyPos = { x: playerX, z: playerZ };
		}

		const shouldUpdateChunk =
			!this.lastUpdatePos ||
			Math.max(
				Math.abs(playerX - this.lastUpdatePos.x),
				Math.abs(playerZ - this.lastUpdatePos.z)
			) >= ChunkManager.MinUpdateDistance;

		if (shouldUpdateChunk) {
			await this.chunkManager.updateChunksAround(playerX, playerZ);
			this.lastUpdatePos = { x: playerX, z: playerZ };
		}
	}

	getColumnHeight(x: number, z: number): number {
		return this.chunkManager.getColumnHeight(x, z);
	}

	/**
	 * 获取指定位置的方块信息
	 */
	getBlock(position: Position) {
		const blockId = ChunkManager.getBlockAt(position.x, position.y, position.z);
		return BlockRegistry.Instance.getById(blockId);
	}

	/**
	 * 设置指定位置的方块ID
	 */
	setBlock(position: Position, blockId: number) {
		ChunkManager.setBlockAt(position.x, position.y, position.z, blockId);
	}
}
