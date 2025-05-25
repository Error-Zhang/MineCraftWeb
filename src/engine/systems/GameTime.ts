export class GameTime {
	private _realSecondsPerDay = 1800; // 现实 1800 秒为游戏 1 天
	private _totalGameSeconds = 0; // 累积游戏秒数

	/** 获取当前总游戏天数（从0开始） */
	public get day(): number {
		return Math.floor(this._totalGameSeconds / 86400);
	}

	/** 获取当前天内的时间（秒数 0 ~ 86399） */
	public get timeOfDaySeconds(): number {
		return this._totalGameSeconds % 86400;
	}

	/** 游戏内小时（0 ~ 23） */
	public get hour(): number {
		return Math.floor(this.timeOfDaySeconds / 3600);
	}

	/** 游戏内分钟（0 ~ 59） */
	public get minute(): number {
		return Math.floor((this.timeOfDaySeconds % 3600) / 60);
	}

	/** 是否为白天（示例：6:00 ~ 18:00） */
	public get isDaytime(): boolean {
		const h = this.hour;
		return h >= 6 && h < 18;
	}

	/** 当前游戏内时间字符串，如 "Day 3, 14:05" */
	public get timeString(): string {
		const h = String(this.hour).padStart(2, "0");
		const m = String(this.minute).padStart(2, "0");
		return `Day ${this.day}, ${h}:${m}`;
	}

	public update(deltaTime: number) {
		this._totalGameSeconds += deltaTime * (86400 / this._realSecondsPerDay); // 按比例推进
	}

	public setTime(time: number) {
		this._totalGameSeconds = time;
	}

	public reset() {
		this._totalGameSeconds = 0;
	}
}
