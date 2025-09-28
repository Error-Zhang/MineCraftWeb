export type PlayerStatusType =
	| "health"
	| "thirst"
	| "hunger"
	| "injury-internal"
	| "injury-external"
	| "energy"
	| "mood";

export type PlayerStatusValues = Record<PlayerStatusType, number>;

export class PlayerStatus {
	private values: PlayerStatusValues;

	constructor(initial?: Partial<PlayerStatusValues>) {
		this.values = {
			health: 1,
			thirst: 1,
			hunger: 1,
			"injury-internal": 1,
			"injury-external": 1,
			energy: 1,
			mood: 1,
			...initial,
		};
	}
}
