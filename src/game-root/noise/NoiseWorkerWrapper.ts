import * as Comlink from "comlink";
import { NoiseWorker } from "./NoiseWorker";
import WorldSetting from "@/game-root/world/WorldSetting.ts";
// 创建并返回worker实例
export default async function createNoiseWorker(worldSetting: WorldSetting) {
	const worker = new Worker(new URL("./NoiseWorker.ts", import.meta.url), {
		type: "module",
	});
	// 包装 Worker 为 Remote<NoiseWorker> 并返回
	const Noise = Comlink.wrap<typeof NoiseWorker>(worker);
	return await new Noise(worldSetting);
}
