export interface ChunkData {
	blocks: Uint16Array;
	position: { x: number; z: number };
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
