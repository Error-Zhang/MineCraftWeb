export class SeededRandom {
	private _seed: number;

	constructor(seed: number) {
		this._seed = seed >>> 0;
	}

	public float(min: number, max: number): number {
		return this.next() * (max - min) + min;
	}

	private next(): number {
		// Mulberry32 算法
		this._seed += 0x6d2b79f5;
		let t = Math.imul(this._seed ^ (this._seed >>> 15), 1 | this._seed);
		t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}
}
