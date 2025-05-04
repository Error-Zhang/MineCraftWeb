import { Mesh, Scene, Vector4 } from "@babylonjs/core";
import { Faces, FaceType, FaceTypes, UVGrid } from "./BlockMeshBuilder";

type AnimationGroup = {
	groupKey: string;
	meshes: {
		mesh: Mesh;
		faceVertexOffsetMap: Partial<Record<FaceType, number>>;
		faceFrameMap: Record<FaceType, number>;
		uvs: number[];
		animatedFaces: FaceType[];
	}[];
	allFrameUVs: Vector4[];
	frameCount: number;
	frameSpeed: number;
	timer: number;
	currentFrame: number;
};

class BlockAnimation {
	private static _instance: BlockAnimation;
	private animationGroups: AnimationGroup[] = [];

	private constructor(private scene: Scene) {
		scene.onBeforeRenderObservable.add(this.update.bind(this));
	}

	public static getInstance(scene: Scene): BlockAnimation {
		if (!this._instance) {
			this._instance = new BlockAnimation(scene);
		}
		return this._instance;
	}

	public registerAnimatedMesh(
		groupKey: string,
		mesh: Mesh,
		faces: Faces | undefined,
		uvGrid: UVGrid
	) {
		const { row, col, regionUV, frameSpeed = 1 } = uvGrid;
		const frameCount = row * col;

		// 生成所有帧的 UV 区域
		const allFrameUVs: Vector4[] = [];
		const frameWidth = (regionUV.z - regionUV.x) / col;
		const frameHeight = (regionUV.w - regionUV.y) / row;
		for (let y = 0; y < row; y++) {
			for (let x = 0; x < col; x++) {
				const uMin = regionUV.x + x * frameWidth;
				const vMin = regionUV.y + y * frameHeight;
				const uMax = uMin + frameWidth;
				const vMax = vMin + frameHeight;
				allFrameUVs.push(new Vector4(uMin, vMin, uMax, vMax));
			}
		}

		const animatedFaces: FaceType[] = FaceTypes.filter(f => !faces || faces[f]);
		const faceFrameMap: Record<FaceType, number> = Object.fromEntries(
			animatedFaces.map(f => [f, 0])
		) as Record<FaceType, number>;

		const faceVertexOffsetMap: Partial<Record<FaceType, number>> = {};
		let vertexOffset = 0;
		for (const face of FaceTypes) {
			if (faces && !faces[face]) continue;
			faceVertexOffsetMap[face] = vertexOffset;
			vertexOffset += 4;
		}

		// 查找是否已有对应 groupKey 的 AnimationGroup
		let group = this.animationGroups.find(g => g.groupKey === groupKey);

		if (!group) {
			group = {
				groupKey,
				meshes: [],
				allFrameUVs,
				frameCount,
				frameSpeed,
				timer: 0,
				currentFrame: 0,
			};
			this.animationGroups.push(group);
		}

		// 注册 mesh 到 group
		group.meshes.push({
			mesh,
			faceVertexOffsetMap,
			faceFrameMap,
			uvs: mesh.getVerticesData("uv")! as number[],
			animatedFaces,
		});
	}

	private update() {
		const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

		for (const group of this.animationGroups) {
			group.timer += deltaTime;
			if (group.timer >= 1 / group.frameSpeed) {
				group.timer = 0;
				group.currentFrame = (group.currentFrame + 1) % group.frameCount;

				const uv = group.allFrameUVs[group.currentFrame];
				const { x: uMin, y: vMin, z: uMax, w: vMax } = uv;

				for (const {
					mesh,
					faceVertexOffsetMap,
					faceFrameMap,
					uvs,
					animatedFaces,
				} of group.meshes) {
					for (const face of animatedFaces) {
						const baseOffset = faceVertexOffsetMap[face]! * 2;
						faceFrameMap[face] = group.currentFrame;

						// 左下、右下、右上、左上
						uvs[baseOffset + 0] = uMin;
						uvs[baseOffset + 1] = vMax;
						uvs[baseOffset + 2] = uMax;
						uvs[baseOffset + 3] = vMax;
						uvs[baseOffset + 4] = uMax;
						uvs[baseOffset + 5] = vMin;
						uvs[baseOffset + 6] = uMin;
						uvs[baseOffset + 7] = vMin;
					}
					mesh.setVerticesData("uv", uvs, true);
				}
			}
		}
	}
}

export default BlockAnimation;
