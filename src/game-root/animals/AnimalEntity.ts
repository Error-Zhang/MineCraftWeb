import { AbstractMesh, Scene } from "@babylonjs/core";
import Assets from "@/game-root/assets";
import AnimalModelCache from "@/game-root/animals/AnimalModelCache.ts";

export function getAnimalModelPath(type: string): string | undefined {
	const { land, birds, sea, special } = Assets.animals as any;
	if (land?.[type]) return land[type];
	if (birds?.[type]) return birds[type];
	if (sea?.[type]) return sea[type];
	if (special?.[type]) return special[type];
	// fallback
	return land?.["Cow"]; // default
}

export class AnimalEntity {
	public model?: AbstractMesh;
	private head?: AbstractMesh;

	// animations disabled for now

	constructor(
		public scene: Scene,
		public id: number,
		public type: string
	) {}

	async loadModel() {
		const modelPath = getAnimalModelPath(this.type);
		if (!modelPath) throw new Error(`No model for animal type ${this.type}`);
		const root = await AnimalModelCache.instantiate(this.type, modelPath, this.scene);
		this.model = root;
		return this.model;
	}

	setPosition(x: number, y: number, z: number) {
		this.model?.position.set(x, y, z);
	}

	moveTo(x: number, y: number, z: number) {
		if (!this.model) return;
		this.model.position.set(x, y, z);
	}

	setForward(dirX: number, _dirY: number, dirZ: number) {
		if (!this.model) return;
		const len = Math.hypot(dirX, dirZ);
		if (len < 1e-3) return;
		const yaw = Math.atan2(dirX, dirZ); // face along XZ plane
		this.model.rotation.y = yaw;
		// small head look offset
		if (this.head) {
			this.head.rotation.y = 0.15 * Math.sin(yaw);
		}
	}

	dispose() {
		this.model?.dispose();
	}
}
