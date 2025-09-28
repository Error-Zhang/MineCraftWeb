import * as signalR from "@microsoft/signalr";
import { ApiResponse } from "@/game-root/client/interface.ts";

export interface IAnimalSpawnData {
  animalId: number;
  worldId: number;
  type: string;
  x: number;
  y: number;
  z: number;
  state: string;
}

export interface IAnimalMoveData {
  animalId: number;
  worldId: number;
  x: number;
  y: number;
  z: number;
  dirX: number;
  dirY: number;
  dirZ: number;
  speed: number;
  state: string;
}

export class AnimalClient {
  private connection: signalR.HubConnection;

  constructor(hubUrl: string) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();
  }

  async connect() {
    await this.connection.start();
    console.log("[AnimalClient] Connected");
  }

  async disconnect() {
    await this.connection.stop();
  }

  async joinWorld(worldId: number) {
    const res = await this.connection.invoke<ApiResponse<null>>("JoinWorld", worldId);
    if (res.code !== 200) throw new Error("加入动物世界失败:" + res.message);
  }

  async getAnimals() {
    return await this.connection.invoke<IAnimalSpawnData[]>("GetAnimals");
  }

  async seedSpawn(centerX: number, centerZ: number, count = 8) {
    await this.connection.invoke<ApiResponse<null>>("SeedSpawn", centerX, centerZ, count);
  }

  onAnimalSpawn(cb: (data: IAnimalSpawnData) => void) {
    this.connection.on("AnimalSpawn", (data: IAnimalSpawnData) => {
      try { cb(data); } catch (e) { console.error(e); }
    });
  }

  onAnimalMove(cb: (moves: IAnimalMoveData[]) => void) {
    this.connection.on("AnimalMove", (data: IAnimalMoveData[]) => {
      try { cb(data); } catch (e) { console.error(e); }
    });
  }
}
