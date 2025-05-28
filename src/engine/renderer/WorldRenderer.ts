import { ChunkRenderer } from "@engine/renderer/ChunkRenderer.ts";
import { ChunkManager } from "../chunk/ChunkManager";
import { Scene } from "@babylonjs/core";
import { Position } from "@engine/types/chunk.type.ts";
import { Chunk } from "../chunk/Chunk";

export class WorldRenderer {
	private renderers: Map<string, ChunkRenderer> = new Map();

	constructor(private scene: Scene) {}

	/**
	 * 更新区块中某一部分时调用
	 * @param positions
	 */
	public updateChunks(positions: Position[] | Position) {
		const allAffectedChunks = new Map<string, Position[]>();
		const chunkSize = ChunkManager.ChunkSize;

		for (const pos of Array.isArray(positions) ? positions : [positions]) {
			const cx = Math.floor(pos.x / chunkSize);
			const cz = Math.floor(pos.z / chunkSize);
			const key = `${cx},${cz}`;

			if (!allAffectedChunks.has(key)) allAffectedChunks.set(key, []);
			allAffectedChunks.get(key)!.push(pos);

			// 只有破坏地形才会影响其他区块
			if (ChunkManager.getBlockAt(pos.x, pos.y, pos.z) !== 0) continue;

			const localX = ((pos.x % chunkSize) + chunkSize) % chunkSize;
			const localZ = ((pos.z % chunkSize) + chunkSize) % chunkSize;

			const isAtMinX = localX === 0;
			const isAtMaxX = localX === chunkSize - 1;
			const isAtMinZ = localZ === 0;
			const isAtMaxZ = localZ === chunkSize - 1;

			// 向相邻区块添加影响点
			if (isAtMinX) {
				const k = `${cx - 1},${cz}`;
				if (!allAffectedChunks.has(k)) allAffectedChunks.set(k, []);
				allAffectedChunks.get(k)!.push(pos);
			}
			if (isAtMaxX) {
				const k = `${cx + 1},${cz}`;
				if (!allAffectedChunks.has(k)) allAffectedChunks.set(k, []);
				allAffectedChunks.get(k)!.push(pos);
			}
			if (isAtMinZ) {
				const k = `${cx},${cz - 1}`;
				if (!allAffectedChunks.has(k)) allAffectedChunks.set(k, []);
				allAffectedChunks.get(k)!.push(pos);
			}
			if (isAtMaxZ) {
				const k = `${cx},${cz + 1}`;
				if (!allAffectedChunks.has(k)) allAffectedChunks.set(k, []);
				allAffectedChunks.get(k)!.push(pos);
			}
		}

		// 遍历所有受影响区块并触发更新
		for (const [key, worldPositions] of allAffectedChunks.entries()) {
			const chunk = ChunkManager.Instance.getChunkByKey(key);
			if (!chunk || !chunk.isVisible) continue;

			const renderer = this.renderers.get(key);
			if (!renderer) continue;

			// 获取当前区块的基准坐标
			const [cx, cz] = key.split(",").map(Number);
			const baseX = cx * chunkSize;
			const baseZ = cz * chunkSize;

			// 转换为区块内坐标
			const localPositions = worldPositions.map(pos => ({
				x: pos.x - baseX,
				y: pos.y,
				z: pos.z - baseZ,
			}));

			renderer.update(localPositions);
		}
	}

	public getRenderer(key: string) {
		return this.renderers.get(key);
	}

	public setChunkVisibility(key: string, visible: boolean) {
		const renderer = this.renderers.get(key);
		if (renderer) {
			renderer.setEnabled(visible);
		}
	}

	public buildChunk(chunk: Chunk) {
		if (chunk.isVisible && !this.renderers.has(chunk.Key)) {
			this.createChunkRenderer(chunk);
		} else {
			this.setChunkVisibility(chunk.Key, chunk.isVisible);
		}
	}

	public unloadChunk(key: string) {
		const renderer = this.renderers.get(key);
		if (renderer) {
			renderer.dispose();
			this.renderers.delete(key);
		}
	}

	public dispose() {
		for (const renderer of this.renderers.values()) {
			renderer.dispose();
		}
		this.renderers.clear();
	}

	private createChunkRenderer(chunk: Chunk): ChunkRenderer {
		const renderer = new ChunkRenderer(this.scene, chunk);
		this.renderers.set(chunk.Key, renderer);
		renderer.build();
		return renderer;
	}
}
