import {
	AbstractMesh,
	ImportMeshAsync,
	PBRMaterial,
	Quaternion,
	Scene,
	Texture,
	Vector3,
} from "@babylonjs/core";

type PartName = "body" | "head" | "hand1" | "hand2" | "leg1" | "leg2";

export class PlayerModel {
	public root!: AbstractMesh;
	public parts: Record<
		PartName,
		{
			mesh: AbstractMesh;
			dfAngle: Vector3;
			targetAngleX: number;
		}
	> = {} as any;
	private walkTime = 0;
	private bodyYaw: number = Math.PI / 2;
	private isWalking = false;

	constructor(private scene: Scene) {}

	public async loadModel(modelPath: string, skinUrl: string) {
		const { meshes } = await ImportMeshAsync(modelPath, this.scene);
		const root = meshes[0];

		meshes.slice(1).forEach(mesh => {
			mesh.setParent(root);
			mesh.isPickable = false;
			mesh.checkCollisions = true;
			mesh.renderingGroupId = 1;
			const texture = new Texture(skinUrl, this.scene);
			texture.vScale = -1;
			(<PBRMaterial>mesh.material).albedoTexture = texture;
			// 收集子部件（用名称识别）
			const name = mesh.name.toLowerCase() as PartName;
			const cloneAngle = mesh.rotationQuaternion!.toEulerAngles().clone();
			this.parts[name] = {
				mesh,
				dfAngle: cloneAngle,
				targetAngleX: 0,
			};
		});
		this.root = root;
		this.registerWalkingAnimation();
		return root;
	}

	public lookYawPitch(pitch: number, yaw: number) {
		// 头部旋转：Yaw(绕Y) + Pitch(绕X)
		this.parts.head.mesh.rotationQuaternion = Quaternion.FromEulerVector(
			this.parts.head.dfAngle.add(new Vector3(-pitch, -yaw + this.bodyYaw, 0))
		);

		// 如果头部与身体偏差过大（比如超过 45°），身体慢慢转过去
		const yawDiff = yaw - this.bodyYaw;
		if (Math.abs(yawDiff) > Math.PI / 6) {
			// 插值或直接调整身体方向
			this.bodyYaw += yawDiff * 0.2; // 0.1 是平滑系数
		}

		// 应用身体旋转
		this.root.rotationQuaternion = Quaternion.FromEulerAngles(0, this.bodyYaw, 0);
	}

	public registerWalkingAnimation() {
		this.scene.onBeforeRenderObservable.add(() => {
			this.onAnimationFrame();
		});
	}

	public startWalking() {
		this.isWalking = true;
	}

	public stopWalking() {
		this.isWalking = false;
		console.log("stop walking");
		// 重置目标角度，让动画系统平滑过渡
		Object.values(this.parts).forEach(part => {
			part.targetAngleX = 0;
		});
	}

	// 动画回调函数
	public onAnimationFrame() {
		if (this.isWalking) {
			const targetAngle = Math.sin(this.walkTime) * 0.8;
			this.walkTime += 0.1;
			this.parts.hand1.targetAngleX = targetAngle;
			this.parts.hand2.targetAngleX = -targetAngle;
			this.parts.leg1.targetAngleX = -targetAngle;
			this.parts.leg2.targetAngleX = targetAngle;
		}

		// 平滑过渡到目标角度
		const updateLimb = ({
			mesh,
			dfAngle,
			targetAngleX,
		}: {
			mesh: AbstractMesh;
			dfAngle: Vector3;
			targetAngleX: number;
		}) => {
			mesh.rotationQuaternion = Quaternion.FromEulerAngles(dfAngle.x + targetAngleX, 0, 0);
		};

		updateLimb(this.parts.hand1);
		updateLimb(this.parts.hand2);
		updateLimb(this.parts.leg1);
		updateLimb(this.parts.leg2);
	}
}
