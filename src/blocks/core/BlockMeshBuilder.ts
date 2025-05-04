import { Color3, Color4, Mesh, Scene, Vector3, Vector4, VertexData } from "@babylonjs/core";

export const FaceTypes = ["front", "back", "right", "left", "top", "bottom"] as const;
export type FaceType = (typeof FaceTypes)[number];
export type Faces = Partial<Record<FaceType, boolean>>;
export type FaceColors = Partial<Record<FaceType, Color4 | Color3>>;
export type UVGrid = {
	row: number;
	col: number;
	regionUV: Vector4;
	frameSpeed?: number;
};
export const FaceDirectionOffset: Record<FaceType, Vector3> = {
	top: new Vector3(0, 1, 0),
	bottom: new Vector3(0, -1, 0),
	left: new Vector3(-1, 0, 0),
	right: new Vector3(1, 0, 0),
	front: new Vector3(0, 0, 1),
	back: new Vector3(0, 0, -1),
};

const FaceVertices: Record<FaceType, Vector3[]> = {
	front: [new Vector3(0, 0, 1), new Vector3(1, 0, 1), new Vector3(1, 1, 1), new Vector3(0, 1, 1)],
	back: [new Vector3(1, 0, 0), new Vector3(0, 0, 0), new Vector3(0, 1, 0), new Vector3(1, 1, 0)],
	left: [new Vector3(0, 0, 0), new Vector3(0, 0, 1), new Vector3(0, 1, 1), new Vector3(0, 1, 0)],
	right: [new Vector3(1, 0, 1), new Vector3(1, 0, 0), new Vector3(1, 1, 0), new Vector3(1, 1, 1)],
	top: [new Vector3(0, 1, 1), new Vector3(1, 1, 1), new Vector3(1, 1, 0), new Vector3(0, 1, 0)],
	bottom: [new Vector3(0, 0, 0), new Vector3(1, 0, 0), new Vector3(1, 0, 1), new Vector3(0, 0, 1)],
};

class BlockMeshBuilder {
	static WaterBlocks: Mesh[] = []; // 所有水方块都推入这里
	static createBlockMesh(
		name: string,
		options: {
			size?: number;
			faceUV: Vector4[]; // Babylon box 格式 UV
			faces?: Faces;
			faceColors?: FaceColors;
		},
		scene: Scene
	): Mesh {
		const { size = 1, faceUV, faces, faceColors } = options;

		const positions: number[] = [];
		const indices: number[] = [];
		const normals: number[] = [];
		const uvs: number[] = [];

		let vertexCount = 0;
		const colors: number[] = [];
		for (let i = 0; i < FaceTypes.length; i++) {
			const face = FaceTypes[i];
			if (faces && !faces[face]) continue;
			const verts = FaceVertices[face];
			const normal = FaceDirectionOffset[face];
			const uv = faceUV[i]!;

			for (let i = 0; i < 4; i++) {
				const v = verts[i].scale(size); // 缩放支持
				positions.push(v.x, v.y, v.z);
				normals.push(normal.x, normal.y, normal.z);

				const u = i === 0 || i === 3 ? uv.x : uv.z;
				const vCoord = i === 0 || i === 1 ? uv.w : uv.y;
				uvs.push(u, vCoord);

				const color = faceColors?.[face] ?? new Color4(1, 1, 1, 1);
				colors.push(color.r, color.g, color.b);
				if (color instanceof Color4) colors.push(color.a); // 只有当材质开启透明的时候a才会生效
			}

			indices.push(
				vertexCount,
				vertexCount + 2,
				vertexCount + 1,
				vertexCount,
				vertexCount + 3,
				vertexCount + 2
			);
			vertexCount += 4;
		}

		const mesh = new Mesh(name, scene);
		if (positions.length) {
			const vertexData = new VertexData();
			vertexData.positions = positions;
			vertexData.normals = normals;
			vertexData.indices = indices;
			vertexData.uvs = uvs;
			vertexData.colors = colors;
			vertexData.applyToMesh(mesh);
		} else {
			console.error("faces的值不能为空对象", faces);
		}

		return mesh;
	}
}

export default BlockMeshBuilder;
