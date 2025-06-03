import { Color3, Color4, VertexData } from "@babylonjs/core";
import { Chunk } from "../chunk/Chunk.ts";
import { BlockRegistry } from "../block/BlockRegistry";
import { BlockDataProcessor } from "../block/BlockDataProcessor.ts";
import { CrossRender, CubeRender, RenderComponent, RenderMaterial } from "../types/block.type.ts";
import { ChunkManager } from "../chunk/ChunkManager.ts";

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

interface MeshBuilderContext {
	mergeGroups: Map<string, MeshData>;
	renderedBlocks: Set<string>;
	modelBlocks: Map<string, number>;
	worldX: number;
	worldZ: number;
}

export class ChunkMeshBuilder {
	public static build(chunk: Chunk, filter?: Set<string>) {
		const context: MeshBuilderContext = {
			mergeGroups: new Map<string, MeshData>(),
			renderedBlocks: new Set<string>(),
			modelBlocks: new Map<string, number>(),
			worldX: chunk.position.x * ChunkManager.ChunkSize,
			worldZ: chunk.position.z * ChunkManager.ChunkSize,
		};

		const [size, height] = [ChunkManager.ChunkSize, ChunkManager.ChunkHeight];

		if (filter && filter.size) {
			this.processChunkEdges(chunk, size, height, context);
			this.processFilteredBlocks(chunk, filter, context);
		} else {
			this.processAllBlocks(chunk, size, height, context);
		}

		return {
			meshGroups: this.createMeshGroups(context.mergeGroups),
			modelBlocks: context.modelBlocks,
			renderedBlocks: context.renderedBlocks,
		};
	}

	private static processFilteredBlocks(
		chunk: Chunk,
		filter: Set<string>,
		context: MeshBuilderContext
	) {
		for (const key of filter) {
			if (!context.renderedBlocks.has(key)) {
				const [x, y, z] = key.split(",").map(Number);
				this.processBlock(chunk, [x, y, z], context);
			}
		}
	}

	private static processChunkEdges(
		chunk: Chunk,
		size: number,
		height: number,
		context: MeshBuilderContext
	) {
		if (!chunk.edges.size) return;

		for (const { edge, getCoords } of EdgeConfigs) {
			if (!chunk.edges.has(edge)) continue;

			for (let y = 0; y < height; y++) {
				for (let i = 0; i < size; i++) {
					// 跳过角落
					const isLeftOrRightEdge = edge === 0 || edge === 1;
					const isTopOrBottomEdge = edge === 2 || edge === 3;

					// 左/右边跳过上下角
					if (isLeftOrRightEdge && (i === 0 || i === size - 1)) continue;

					// 上/下边跳过左右角
					if (isTopOrBottomEdge && (i === 0 || i === size - 1)) continue;

					const [x, yCoord, z] = getCoords(i, y);
					this.processBlock(chunk, [x, yCoord, z], context);
				}
			}
		}

		chunk.edges.clear();
	}

	private static processAllBlocks(
		chunk: Chunk,
		size: number,
		height: number,
		context: MeshBuilderContext
	) {
		for (let z = 0; z < size; z++) {
			for (let x = 0; x < size; x++) {
				for (let y = 0; y < height; y++) {
					this.processBlock(chunk, [x, y, z], context);
				}
			}
		}
	}

	private static processBlock(
		chunk: Chunk,
		[x, y, z]: [number, number, number],
		context: MeshBuilderContext
	) {
		const key = `${x},${y},${z}`;
		const [blockValue, blockId, block, envValue] = this.getBlockAt(x, y, z, chunk);
		if (!block?.render) return;
		const [wx, wy, wz] = [context.worldX + x, y, context.worldZ + z];
		let target = this.initData();
		if (block.render.type !== "model") {
			const matKey = block.render.material.matKey;
			if (!context.mergeGroups.has(matKey)) {
				context.mergeGroups.set(matKey, target);
			} else {
				target = context.mergeGroups.get(matKey)!;
			}
		}

		switch (block.render.type) {
			case "cube": {
				let render = block.render as CubeRender;
				let hasFace = false;
				for (let i = 0; i < 6; i++) {
					const normal = FaceDirectionOffset[i];

					const [_, neighborId, neighbor] = this.getBlockAt(
						wx + normal[0],
						wy + normal[1],
						wz + normal[2]
					);
					let shouldRender = this.shouldRenderFace(blockId, neighborId, render, neighbor?.render);
					if (shouldRender) {
						this.addFace(target, [wx, wy, wz], blockValue, envValue, render, i);
						hasFace = true;
					}
				}
				if (hasFace) {
					context.renderedBlocks.add(key);
				}
				break;
			}
			case "cross": {
				let render = block.render as CrossRender;
				this.addCross(target, [wx, wy, wz], blockValue, render, envValue);
				context.renderedBlocks.add(key);
				break;
			}
			case "model": {
				context.modelBlocks.set(`${wx},${wy},${wz}`, blockId);
				context.renderedBlocks.add(key);
				break;
			}
		}
	}

	private static getBlockAt(x: number, y: number, z: number, chunk?: Chunk) {
		let blockValue = chunk ? chunk.getBlock(x, y, z) : ChunkManager.getBlockAt(x, y, z);
		let envValue = chunk ? chunk.getEnvironment(x, z) : ChunkManager.Instance.getEnvironment(x, z);
		let id = BlockDataProcessor.getId(blockValue);
		let def = BlockRegistry.Instance.getById(id);
		return [blockValue, id, def, envValue] as const;
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
		[x, y, z]: [number, number, number],
		blockValue: number,
		envValue: number,
		render: CubeRender,
		index: number
	) {
		const orientation = render.getRotation?.(blockValue, index) ?? 0;
		const faceMap = {
			0: [0, 1, 2, 3, 4, 5],
			1: [4, 5, 2, 3, 0, 1],
			2: [0, 1, 4, 5, 2, 3],
		};

		const mappedIndex = faceMap[orientation]?.[index] ?? index;
		const uv = render.getUv?.(blockValue, mappedIndex) ?? render.uvs[mappedIndex];
		const surfaceColor = mappedIndex === 4 ? render.material.surfaceColor : undefined;
		let color =
			render.getColor?.(blockValue, mappedIndex, envValue) ??
			render.material.color ??
			new Color3(1, 1, 1);

		const vertices = FaceVertices[index];
		const normal = FaceDirectionOffset[index];
		const baseIndex = data.positions.length / 3;

		for (const [vx, vy, vz] of vertices) {
			data.positions.push(x + vx, y + vy, z + vz);
			data.normals.push(...normal);
		}

		data.indices.push(
			baseIndex,
			baseIndex + 2,
			baseIndex + 1,
			baseIndex,
			baseIndex + 3,
			baseIndex + 2
		);

		let uvOrder = [
			[0, 1],
			[1, 1],
			[1, 0],
			[0, 0],
		];

		if (orientation === 1 && (index === 2 || index === 3)) {
			uvOrder = [
				[1, 1],
				[1, 0],
				[0, 0],
				[0, 1],
			];
		} else if (orientation === 2 && (index === 4 || index === 5 || index === 0 || index === 1)) {
			uvOrder = [
				[0, 0],
				[0, 1],
				[1, 1],
				[1, 0],
			];
		}

		for (const [uRatio, vRatio] of uvOrder) {
			const u = uv.x + (uv.z - uv.x) * uRatio;
			const v = uv.y + (uv.w - uv.y) * vRatio;
			data.uvs.push(u, v);
		}

		if (surfaceColor && !render.getColor) color = surfaceColor;
		for (let i = 0; i < 4; i++) {
			data.colors.push(color.r, color.g, color.b, (<Color4>color).a ?? 1);
		}
	}

	private static addCross(
		data: MeshData,
		[x, y, z]: [number, number, number],
		blockValue: number,
		render: CrossRender,
		envValue: number
	) {
		const uv = render.uvs[render.getStage?.(blockValue) || 0];
		let color =
			render.getColor?.(blockValue, 0, envValue) ??
			render.material.surfaceColor ??
			render.material.color ??
			new Color3(1, 1, 1);
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
			data.colors.push(color.r, color.g, color.b, (<Color4>color).a ?? 1);
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
