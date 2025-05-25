import { Vector4, VertexData } from "@babylonjs/core";
import { Chunk } from "../chunk/Chunk.ts";
import { BlockRegistry } from "@engine/block/BlockRegistry";
import { CrossRender, CubeRender, RenderComponent, RenderMaterial } from "../types/block.type.ts";
import { ChunkManager } from "@engine/chunk/ChunkManager.ts";

export const FaceDirectionOffset: [number, number, number][] = [
	[0, 0, 1], // front (z+)
	[0, 0, -1], // back (z-)
	[1, 0, 0], // right (x+)
	[-1, 0, 0], // left (x-)
	[0, 1, 0], // top (y+)
	[0, -1, 0], // bottom (y-)
];

const FaceVertices: [number, number, number][][] = [
	// front (z+)
	[
		[0, 0, 1],
		[1, 0, 1],
		[1, 1, 1],
		[0, 1, 1],
	],
	// back (z-)
	[
		[1, 0, 0],
		[0, 0, 0],
		[0, 1, 0],
		[1, 1, 0],
	],
	// right (x+)
	[
		[1, 0, 1],
		[1, 0, 0],
		[1, 1, 0],
		[1, 1, 1],
	],
	// left (x-)
	[
		[0, 0, 0],
		[0, 0, 1],
		[0, 1, 1],
		[0, 1, 0],
	],
	// top (y+)
	[
		[0, 1, 1],
		[1, 1, 1],
		[1, 1, 0],
		[0, 1, 0],
	],
	// bottom (y-)
	[
		[0, 0, 0],
		[1, 0, 0],
		[1, 0, 1],
		[0, 0, 1],
	],
];

interface MeshData {
	positions: number[];
	indices: number[];
	uvs: number[];
	normals: number[];
	indexOffset: number;
	material?: RenderMaterial;
}

export class ChunkMeshBuilder {
	public static build(
		chunk: Chunk,
		filter?: Set<string>
	) {
		const mergeGroups = new Map<string, MeshData>();
		const [size, height] = [ChunkManager.ChunkSize, ChunkManager.ChunkHeight];
		const worldX = chunk.position.x * size;
		const worldZ = chunk.position.z * size;
		const renderedBlocks = new Set<string>();
		const modelBlocks = new Map<string, number>();

		const iterate = (x: number, y: number, z: number) => {
			const key = `${x},${y},${z}`;
			const blockId = chunk.getBlock(x, y, z);
			if (blockId === 0) return;

			const def = BlockRegistry.Instance.getById(blockId);
			if (!def?.render) return;

			renderedBlocks.add(key);

			const posX = worldX + x;
			const posY = y;
			const posZ = worldZ + z;

			switch (def.render.type) {
				case "cube": {
					const render = def.render as CubeRender;
					const matKey = render.material.matKey;

					if (!mergeGroups.has(matKey)) {
						mergeGroups.set(matKey, this.initData());
					}
					const target = mergeGroups.get(matKey)!;
					target.material = render.material;

					for (let i = 0; i < 6; i++) {
						const normal = FaceDirectionOffset[i];
						const nx = posX + normal[0];
						const ny = posY + normal[1];
						const nz = posZ + normal[2];
						const neighborId = ChunkManager.getBlockAt(nx, ny, nz);
						const neighbor = BlockRegistry.Instance.getById(neighborId);
						const shouldRender = this.shouldRenderFace(
							blockId,
							neighborId,
							render,
							neighbor?.render!
						);
						if (shouldRender) {
							this.addFace(target, posX, posY, posZ, i, render.uvs[i]);
						}
					}
					break;
				}
				case "cross": {
					const render = def.render as CrossRender;
					const matKey = render.material.matKey;

					if (!mergeGroups.has(matKey)) {
						mergeGroups.set(matKey, this.initData());
					}
					const target = mergeGroups.get(matKey)!;
					target.material = render.material;

					this.addCross(target, posX, posY, posZ, render.uvs[render.uvIndex]);
					break;
				}
				case "model": {
					modelBlocks.set(key, blockId);
					break;
				}
			}
		};

		if (filter) {
			for (const key of filter) {
				const [x, y, z] = key.split(",").map(Number);
				iterate(x, y, z);
			}
		} else {
			for (let y = 0; y < height; y++) {
				for (let z = 0; z < size; z++) {
					for (let x = 0; x < size; x++) {
						iterate(x, y, z);
					}
				}
			}
		}

		const meshGroups: Record<string, VertexData> = {};
		for (const [matKey, data] of mergeGroups.entries()) {
			meshGroups[matKey] = this.createVertexData(data);
		}

		return {
			meshGroups,
			modelBlocks,
			renderedBlocks,
		};
	}

	private static shouldRenderFace(
		currentId: number,
		neighborId: number,
		currentRender: CubeRender,
		neighborRender: RenderComponent
	): boolean {
		// 1. 邻居方块不存在，应该渲染
		if (!neighborId) return true;

		// 2. 相同方块，不渲染（避免内部面）
		if (neighborId === currentId) return false;

		// 3. 当前方块是立方体，邻居不是立方体，应该渲染
		if (currentRender.type === "cube" && neighborRender.type !== "cube") return true;
		if (currentRender.type === "cube" && neighborRender.type === "cube") return false;

		// 4. 处理透明度情况
		if (currentRender.transparencyType !== "opaque") {
			// 4.1 当前方块透明，邻居不透明，不渲染
			if (
				neighborRender.type === "cube" &&
				(neighborRender as CubeRender).transparencyType === "opaque"
			) {
				return false;
			}
			// 4.2 当前方块透明，邻居也透明，比较透明度
			if (
				neighborRender.type === "cube" &&
				(neighborRender as CubeRender).transparencyType !== "opaque"
			) {
				// 如果邻居更透明，渲染当前面
				return (neighborRender as CubeRender).transparencyType === "transparent";
			}
		}

		// 5. 当前方块不透明，邻居透明，应该渲染
		if (
			currentRender.transparencyType === "opaque" &&
			neighborRender.type === "cube" &&
			(neighborRender as CubeRender).transparencyType !== "opaque"
		) {
			return true;
		}

		// 6. 其他情况，默认渲染
		return true;
	}

	private static initData(): MeshData {
		return {
			positions: [],
			indices: [],
			uvs: [],
			normals: [],
			indexOffset: 0,
		};
	}

	private static addFace(
		data: MeshData,
		x: number,
		y: number,
		z: number,
		faceIndex: number,
		uv: Vector4
	) {
		const vertices = FaceVertices[faceIndex];
		const normal = FaceDirectionOffset[faceIndex];
		const baseIndex = data.positions.length / 3;

		for (const [vx, vy, vz] of vertices) {
			data.positions.push(x + vx, y + vy, z + vz);
			data.normals.push(...normal);
		}

		// 正确的索引顺序
		data.indices.push(
			baseIndex,
			baseIndex + 2,
			baseIndex + 1,
			baseIndex,
			baseIndex + 3,
			baseIndex + 2
		);

		// 顺时针映射 uv
		const uvOrder = [
			[0, 1],
			[1, 1],
			[1, 0],
			[0, 0],
		];

		for (const [uRatio, vRatio] of uvOrder) {
			const u = uv.x + (uv.z - uv.x) * uRatio;
			const v = uv.y + (uv.w - uv.y) * vRatio;
			data.uvs.push(u, v);
		}
	}

	private static addCross(data: MeshData, x: number, y: number, z: number, uv: Vector4) {
		const baseIndex = data.positions.length / 3;

		const positions = [
			// plane 1 (/)
			[x, y + 1, z + 1],
			[x + 1, y + 1, z],
			[x + 1, y, z],
			[x, y, z + 1],
			// plane 2 (\)
			[x, y + 1, z],
			[x + 1, y + 1, z + 1],
			[x + 1, y, z + 1],
			[x, y, z],
		];

		data.positions.push(...positions.flat());

		for (let i = 0; i < 8; i++) {
			data.normals.push(0, 1, 0); // 平均法线
		}

		data.indices.push(
			baseIndex,
			baseIndex + 1,
			baseIndex + 2,
			baseIndex,
			baseIndex + 2,
			baseIndex + 3,
			baseIndex + 4,
			baseIndex + 5,
			baseIndex + 6,
			baseIndex + 4,
			baseIndex + 6,
			baseIndex + 7
		);

		const uvOrder = [
			[0, 0],
			[1, 0],
			[1, 1],
			[0, 1],
		];

		for (let i = 0; i < 2; i++) {
			for (const [uRatio, vRatio] of uvOrder) {
				const u = uv.x + (uv.z - uv.x) * uRatio;
				const v = uv.y + (uv.w - uv.y) * vRatio;
				data.uvs.push(u, v);
			}
		}
	}

	private static createVertexData(group: MeshData): VertexData {
		const vd = new VertexData();
		vd.positions = group.positions;
		vd.indices = group.indices;
		vd.uvs = group.uvs;
		vd.normals = group.normals;
		return vd;
	}
}
