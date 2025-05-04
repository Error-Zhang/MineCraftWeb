export class Grid2D {
	private width: number;
	private height: number;
	private data: number[];

	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.data = new Array(this.width * this.height);
	}

	public get(x: number, y: number): number {
		return this.data[x + y * this.width];
	}

	public set(x: number, y: number, value: number): void {
		this.data[x + y * this.width] = value;
	}
}

export class Grid3D {
	sizeX: number;
	sizeZ: number;
	sizeY: number;
	private sizeXY: number;
	private data: Float32Array;

	constructor(sizeX: number, sizeY: number, sizeZ: number) {
		this.sizeX = sizeX;
		this.sizeY = sizeY;
		this.sizeZ = sizeZ;
		this.sizeXY = this.sizeX * this.sizeY;
		this.data = new Float32Array(this.sizeX * this.sizeY * this.sizeZ);
	}

	// Get 8 neighboring values (cube corners)
	public get8(
		x: number,
		y: number,
		z: number
	): [number, number, number, number, number, number, number, number] {
		const index = x + y * this.sizeX + z * this.sizeXY;
		return [
			this.data[index], // v111
			this.data[index + 1], // v211
			this.data[index + this.sizeX], // v121
			this.data[index + 1 + this.sizeX], // v221
			this.data[index + this.sizeXY], // v112
			this.data[index + 1 + this.sizeXY], // v212
			this.data[index + this.sizeX + this.sizeXY], // v122
			this.data[index + 1 + this.sizeX + this.sizeXY], // v222
		];
	}

	// Get a single value from the grid
	public get(x: number, y: number, z: number): number {
		return this.data[x + y * this.sizeX + z * this.sizeXY];
	}

	// Set a value at a specific position
	public set(x: number, y: number, z: number, value: number): void {
		this.data[x + y * this.sizeX + z * this.sizeXY] = value;
	}

	public trimOuterXZ(): Grid3D {
		const newSizeX = this.sizeX - 2;
		const newSizeZ = this.sizeZ - 2;

		if (newSizeX <= 0 || newSizeZ <= 0) {
			throw new Error("Cannot trim: resulting size would be zero or negative.");
		}

		const trimmed = new Grid3D(newSizeX, this.sizeY, newSizeZ);

		for (let x = 1; x < this.sizeX - 1; x++) {
			for (let y = 0; y < this.sizeY; y++) {
				for (let z = 1; z < this.sizeZ - 1; z++) {
					const value = this.get(x, y, z);
					trimmed.set(x - 1, y, z - 1, value);
				}
			}
		}

		return trimmed;
	}
}
