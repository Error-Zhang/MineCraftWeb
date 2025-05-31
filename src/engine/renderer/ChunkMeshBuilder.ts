import { Color4, Vector4, VertexData } from "@babylonjs/core";
import { Chunk } from "../chunk/Chunk.ts";
import { BlockRegistry } from "@engine/block/BlockRegistry";
import { CrossRender, CubeRender, RenderComponent, RenderMaterial } from "../types/block.type.ts";
import { ChunkManager } from "@engine/chunk/ChunkManager.ts";

export const EdgeConfigs = [
	{
		edge: 0, // 左边界 (-X)
		dx: -1,
		dz: 0,
		getCoords: (i: number, y: number) => [0, y, i],
	},
	{
		edge: 1, // 右边界 (+X)
		dx: 1,
		dz: 0,
		getCoords: (i: number, y: number) => [ChunkManager.ChunkSize - 1, y, i],
	},
	{
		edge: 2, // 下边界 (-Z)
		dx: 0,
		dz: -1,
		getCoords: (i: number, y: number) => [i, y, 0],
	},
	{
		edge: 3, // 上边界 (+Z)
		dx: 0,
		dz: 1,
		getCoords: (i: number, y: number) => [i, y, ChunkManager.ChunkSize - 1],
	},
];
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
	colors: number[];
	indexOffset: number;
	material?: RenderMaterial;
}

export class ChunkMeshBuilder {
	public static build(chunk: Chunk, filter?: Set<string>) {
		const mergeGroups = new Map<string, MeshData>();
		const [size, height] = [ChunkManager.ChunkSize, ChunkManager.ChunkHeight];
		const worldX = chunk.position.x * size;
		const worldZ = chunk.position.z * size;
		const renderedBlocks = new Set<string>();
		const modelBlocks = new Map<string, number>();
		if (filter && filter.size) {
			this.processChunkEdges(chunk, size, height, mergeGroups, renderedBlocks, modelBlocks);
			this.processFilteredBlocks(
				chunk,
				filter,
				worldX,
				worldZ,
				mergeGroups,
				renderedBlocks,
				modelBlocks
			);
		} else {
			this.processAllBlocks(
				chunk,
				size,
				height,
				worldX,
				worldZ,
				mergeGroups,
				renderedBlocks,
				modelBlocks
			);
		}

		return {
			meshGroups: this.createMeshGroups(mergeGroups),
			modelBlocks,
			renderedBlocks,
		};
	}

	private static processFilteredBlocks(
		chunk: Chunk,
		filter: Set<string>,
		worldX: number,
		worldZ: number,
		mergeGroups: Map<string, MeshData>,
		renderedBlocks: Set<string>,
		modelBlocks: Map<string, number>
	) {
		for (const key of filter) {
			if (!renderedBlocks.has(key)) {
				const [x, y, z] = key.split(",").map(Number);
				this.processBlock(chunk, x, y, z, worldX, worldZ, mergeGroups, renderedBlocks, modelBlocks);
			}
		}
	}

	private static processChunkEdges(
		chunk: Chunk,
		size: number,
		height: number,
		mergeGroups: Map<string, MeshData>,
		renderedBlocks: Set<string>,
		modelBlocks: Map<string, number>
	) {
		if (!chunk.edges.size) return;
		for (const { edge, getCoords } of EdgeConfigs) {
			if (!chunk.edges.has(edge)) continue;

			for (let y = 0; y < height; y++) {
				for (let i = 0; i < size; i++) {
					const [x, yCoord, z] = getCoords(i, y);
					this.processBlock(
						chunk,
						x,
						yCoord,
						z,
						chunk.position.x * size,
						chunk.position.z * size,
						mergeGroups,
						renderedBlocks,
						modelBlocks
					);
				}
			}
		}

		chunk.edges.clear();
	}

	private static processAllBlocks(
		chunk: Chunk,
		size: number,
		height: number,
		worldX: number,
		worldZ: number,
		mergeGroups: Map<string, MeshData>,
		renderedBlocks: Set<string>,
		modelBlocks: Map<string, number>
	) {
		for (let z = 0; z < size; z++) {
			for (let x = 0; x < size; x++) {
				for (let y = 0; y < height; y++) {
					this.processBlock(
						chunk,
						x,
						y,
						z,
						worldX,
						worldZ,
						mergeGroups,
						renderedBlocks,
						modelBlocks
					);
				}
			}
		}
	}

	private static processBlock(
		chunk: Chunk,
		x: number,
		y: number,
		z: number,
		worldX: number,
		worldZ: number,
		mergeGroups: Map<string, MeshData>,
		renderedBlocks: Set<string>,
		modelBlocks: Map<string, number>
	) {
		const key = `${x},${y},${z}`;
		const blockId = chunk.getBlock(x, y, z);
		if (blockId === 0) return;

		const def = BlockRegistry.Instance.getById(blockId);
		if (!def?.render) return;

		const posX = worldX + x;
		const posY = y;
		const posZ = worldZ + z;

		switch (def.render.type) {
			case "cube": {
				this.processCubeBlock(
					def.render as CubeRender,
					posX,
					posY,
					posZ,
					blockId,
					mergeGroups,
					renderedBlocks,
					key
				);
				break;
			}
			case "cross": {
				this.processCrossBlock(
					def.render as CrossRender,
					posX,
					posY,
					posZ,
					mergeGroups,
					renderedBlocks,
					key
				);
				break;
			}
			case "model": {
				modelBlocks.set(`${posX},${posY},${posZ}`, blockId);
				renderedBlocks.add(key);
				break;
			}
		}
	}

	private static processCubeBlock(
		render: CubeRender,
		posX: number,
		posY: number,
		posZ: number,
		blockId: number,
		mergeGroups: Map<string, MeshData>,
		renderedBlocks: Set<string>,
		key: string
	) {
		const matKey = render.material.matKey;
		if (!mergeGroups.has(matKey)) {
			mergeGroups.set(matKey, this.initData());
		}
		const target = mergeGroups.get(matKey)!;

		let hasFace = false;
		for (let i = 0; i < 6; i++) {
			const normal = FaceDirectionOffset[i];
			const nx = posX + normal[0];
			const ny = posY + normal[1];
			const nz = posZ + normal[2];
			const neighborId = ChunkManager.getBlockAt(nx, ny, nz);
			const neighbor = BlockRegistry.Instance.getById(neighborId);

			let shouldRender = this.shouldRenderFace(blockId, neighborId, render, neighbor?.render);
			if (shouldRender) {
				let surfaceColor = i === 4 ? render.material.surfaceColor : undefined;
				this.addFace(target, posX, posY, posZ, i, render.uvs[i], surfaceColor);
				hasFace = true;
			}
		}
		if (hasFace) {
			renderedBlocks.add(key);
		}
	}

	private static processCrossBlock(
		render: CrossRender,
		posX: number,
		posY: number,
		posZ: number,
		mergeGroups: Map<string, MeshData>,
		renderedBlocks: Set<string>,
		key: string
	) {
		const matKey = render.material.matKey;
		if (!mergeGroups.has(matKey)) {
			mergeGroups.set(matKey, this.initData());
		}
		const target = mergeGroups.get(matKey)!;

		this.addCross(
			target,
			posX,
			posY,
			posZ,
			render.uvs[render.uvIndex],
			render.material.surfaceColor
		);
		renderedBlocks.add(key);
	}

	private static createMeshGroups(mergeGroups: Map<string, MeshData>): Record<string, VertexData> {
		const meshGroups: Record<string, VertexData> = {};
		for (const [matKey, data] of mergeGroups.entries()) {
			if (data.positions.length) {
				meshGroups[matKey] = this.createVertexData(data);
			}
		}
		return meshGroups;
	}

	private static shouldRenderFace(
		currentId: number,
		neighborId: number,
		currentRender: CubeRender,
		neighborRender?: RenderComponent
	): boolean {
		// 超出范围，不渲染
		if (neighborId === -1) return false;
		// 1. 邻居方块空气，应该渲染
		if (neighborId === 0) return true;

		// 2. 相同方块，不渲染（避免内部面）
		if (neighborId === currentId) return false;

		// 3.邻居不是立方体，应该渲染
		if (neighborRender) {
			if (neighborRender.type !== "cube") return true;

			switch (currentRender.transparencyType) {
				case "opaque":
					return neighborRender.transparencyType !== "opaque";
				case "cutout":
					return neighborRender.transparencyType === "transparent";
				case "transparent":
					return false;
			}
		}

		// 其他情况，默认渲染
		return true;
	}

	private static initData(): MeshData {
		return {
			positions: [],
			indices: [],
			uvs: [],
			normals: [],
			colors: [],
			indexOffset: 0,
		};
	}

	private static addFace(
		data: MeshData,
		x: number,
		y: number,
		z: number,
		faceIndex: number,
		uv: Vector4,
		surfaceColor: Color4 = new Color4(1, 1, 1, 1)
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

		for (let i = 0; i < 4; i++) {
			data.colors.push(surfaceColor.r, surfaceColor.g, surfaceColor.b, surfaceColor.a);
		}
	}

	private static addCross(
		data: MeshData,
		x: number,
		y: number,
		z: number,
		uv: Vector4,
		surfaceColor: Color4 = new Color4(1, 1, 1, 1)
	) {
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

		for (let i = 0; i < 8; i++) {
			data.colors.push(surfaceColor.r, surfaceColor.g, surfaceColor.b, surfaceColor.a);
		}
	}

	private static createVertexData(group: MeshData): VertexData {
		const vd = new VertexData();
		vd.positions = group.positions;
		vd.indices = group.indices;
		vd.uvs = group.uvs;
		vd.normals = group.normals;
		vd.colors = group.colors;
		return vd;
	}
}
