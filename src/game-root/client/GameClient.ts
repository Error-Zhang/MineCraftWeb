import { PlayerClient } from "./PlayerClient.ts";
import { WorldClient } from "./WorldClient.ts";
import { BASE_URL } from "@/api/request.ts";

class GameClient {
	private static instance: GameClient | null = null;
	private static isConnecting = false;
	private static connectPromise: Promise<GameClient> | null = null;
	public player: PlayerClient;
	public world: WorldClient;

	private constructor(baseUrl: string) {
		this.player = new PlayerClient(`${baseUrl}/playerhub`);
		this.world = new WorldClient(`${baseUrl}/worldhub`);
	}

	public static getInstance(baseUrl = BASE_URL): Promise<GameClient> {
		if (GameClient.instance) return Promise.resolve(GameClient.instance);
		if (GameClient.connectPromise) return GameClient.connectPromise;

		GameClient.connectPromise = new Promise(async (resolve, reject) => {
			try {
				const client = new GameClient(baseUrl);
				await client.connectAll();
				GameClient.instance = client;
				resolve(client);
			} catch (err) {
				reject(err);
			}
		});

		return GameClient.connectPromise;
	}

	private async connectAll() {
		await Promise.all([this.player.connect(), this.world.connect()]);
	}
}

export default GameClient;
