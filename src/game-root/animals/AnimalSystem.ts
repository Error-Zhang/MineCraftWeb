import { Scene } from "@babylonjs/core";
import { AnimalEntity } from "@/game-root/animals/AnimalEntity.ts";
import { IAnimalMoveData, IAnimalSpawnData } from "@/game-root/client/AnimalClient.ts";

export class AnimalSystem {
  private animals = new Map<number, AnimalEntity>();
  constructor(private scene: Scene) {}

  async spawn(data: IAnimalSpawnData) {
    let ent = this.animals.get(data.animalId);
    if (ent) return ent;
    ent = new AnimalEntity(this.scene, data.animalId, data.type);
    await ent.loadModel();
    ent.setPosition(data.x, data.y, data.z);
    this.animals.set(data.animalId, ent);
    return ent;
  }

  async loadSnapshot(list: IAnimalSpawnData[]) {
    const spawned: AnimalEntity[] = [];
    for (const a of list) {
      if (!this.animals.has(a.animalId)) {
        const ent = await this.spawn(a);
        spawned.push(ent);
      }
    }
    return spawned;
  }

  onMoves(moves: IAnimalMoveData[]) {
    for (const m of moves) {
      const ent = this.animals.get(m.animalId);
      if (!ent) continue;
      ent.moveTo(m.x, m.y, m.z);
      ent.setForward(m.dirX, m.dirY, m.dirZ);
    }
  }

  dispose() {
    this.animals.forEach(a => a.dispose());
    this.animals.clear();
  }
}
