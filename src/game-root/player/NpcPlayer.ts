import { Mesh, Scene, Vector3 } from "@babylonjs/core";
import { PlayerModel } from "@/game-root/player/PlayerModel.ts";
import Assets from "@/game-root/assets";

export class NpcPlayer {
	public model!: Mesh;

	constructor(
		public scene: Scene,
		private playerId: number
	) {
		const playerModel = new PlayerModel(this.scene);
		playerModel.loadPlayerModel(Assets.player.models.HumanMale).then(model => {
			this.model = model;
		});
	}

	public setPosition(position: Vector3) {
		this.model.position = position;
	}

	public move(position: Vector3) {}

	public moveTo(position: Vector3) {
		this.model.position = position;
	}

	public dispose() {
		this.model.dispose();
	}
}
