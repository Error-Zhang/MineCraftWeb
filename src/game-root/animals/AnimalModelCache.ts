import { AbstractMesh, ImportMeshAsync, Scene } from "@babylonjs/core";

class AnimalModelCache {
	private static prototypes: Map<string, AbstractMesh> = new Map();

	static async instantiate(type: string, modelPath: string, scene: Scene) {
		let proto = this.prototypes.get(type);
		if (!proto) {
			const result = await ImportMeshAsync(modelPath, scene);
			proto = result.meshes[0];
			result.meshes.slice(1).forEach(m => {
				m.setEnabled(false);
			});
			this.prototypes.set(type, proto);
		}

		const instanceRoot: AbstractMesh = proto.clone(`${type}_inst`, null)!;

		const meshes = instanceRoot.getChildMeshes();

		meshes.forEach((m: AbstractMesh) => {
			m.isPickable = false;
			m.checkCollisions = false;
			m.renderingGroupId = 1;
			m.setEnabled(true);
		});
		return instanceRoot;
	}
}

export default AnimalModelCache;
