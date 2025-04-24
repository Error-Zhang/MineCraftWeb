import FastNoiseLite from "fastnoise-lite";
import { World } from "@/game-root/world/World.ts";
import { Chunk, CHUNK_SIZE } from "@/game-root/world/Chunk.ts";
import { Scene, Vector2, Vector3 } from "@babylonjs/core";
import GrassBlock from "@/blocks/natures/GrassBlock.ts";

interface NoiseOptions {
    seed?: number;
    amplitude?: number;
    frequency?: number;
    octaves?: number;
}

export class WorldGenerator {
    private scene: Scene;
    private noise: typeof FastNoiseLite;
    private seed: number;
    private amplitude: number;
    private frequency: number;
    private octaves: number;

    constructor(scene: Scene, {
        seed = Math.floor(Math.random() * 10000),
        amplitude = 1,
        frequency = 0.05,
        octaves = 4
    }: NoiseOptions = {}) {
        this.scene = scene;
        this.seed = seed;
        this.amplitude = amplitude;
        this.frequency = frequency;
        this.octaves = octaves;

        this.noise = new FastNoiseLite(seed);
        this.noise.SetNoiseType(FastNoiseLite.NoiseType.Perlin);
        this.noise.SetFrequency(frequency);
    }

    generateHeight(x: number, y: number): number {
        let value = 0;
        let amp = this.amplitude;
        let freq = this.frequency;

        for (let i = 0; i < this.octaves; i++) {
            value += this.noise.GetNoise(x * freq, y * freq) * amp;
            amp *= 0.5;
            freq *= 2;
        }

        return value;
    }

    generateFlatWorld(radius: number, height: number = 0): World {
        const world = new World(this.scene);

        for (let cx = -radius; cx <= radius; cx++) {
            for (let cz = -radius; cz <= radius; cz++) {
                const chunk = this.createFlatChunk(cx, cz, height, world);
                world.setChunk(new Vector2(cx, cz), chunk);
                chunk.render();
            }
        }

        return world;
    }

    private createFlatChunk(cx: number, cz: number, height: number, world: World): Chunk {
        const chunk = new Chunk(new Vector2(cx, cz), world);

        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const wx = cx * CHUNK_SIZE + x;
                const wz = cz * CHUNK_SIZE + z;

                const block = new GrassBlock(this.scene,new Vector3(wx, height, wz));
                chunk.setBlock(new Vector3(x, height, z), block);
            }
        }

        return chunk;
    }
}
