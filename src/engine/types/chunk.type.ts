export interface ChunkData {
	blocks: number[];
	position: { x: number; z: number };
	dirtyBlocks: Record<string, number>;
	shafts: number[];
}

export type Coords = {
	x: number;
	z: number;
}[];

export interface Position {
	x: number;
	y: number;
	z: number;
}
