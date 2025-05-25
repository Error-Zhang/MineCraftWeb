export interface ChunkData {
	blocks: number[];
	position: { x: number; z: number };
	dirtyBlocks: Record<string, number>;
}

export interface Position {
	x: number;
	y: number;
	z: number;
}
