export interface IGrowable {
	growable: {
		stage: number;
		maxStage: number;

		grow(): void;
	};
}
