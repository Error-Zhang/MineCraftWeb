type BlockData = { x: number; y: number; z: number; blockId: number };

export class BlockPlacement {
	private queue: Map<string, BlockData> = new Map(); // 用于去重
	private flushing = false;
	private lastFlushTime = 0;
	private readonly flushInterval = 100; // ms
	private readonly maxPerFlush = 50;

	constructor(
		private world: { setBlocks: (blocks: BlockData[]) => Promise<void> },
		private vertexBuilder?: { setBlock: (...args: any[]) => Promise<void> }
	) {
		this.scheduleFlushLoop();
	}

	public enqueuePlacement(data: BlockData) {
		const key = this.getKey(data);
		this.queue.set(key, data);

		// 如果隔了足够时间，首个立即响应
		if (performance.now() - this.lastFlushTime > this.flushInterval && !this.flushing) {
			this.flushImmediately();
		}
	}

	private async flushImmediately() {
		this.flushing = true;
		await this.flushQueue();
		this.flushing = false;
	}

	private async flushQueue() {
		const blocks = Array.from(this.queue.values()).slice(0, this.maxPerFlush);
		this.queue.clear(); // 可以改成 slice + keep 剩余项（如下优化）

		if (this.vertexBuilder) {
			for (const block of blocks) {
				await this.vertexBuilder.setBlock(block.x, block.y, block.z, block.blockId);
			}
		}
		await this.world.setBlocks(blocks);
		this.lastFlushTime = performance.now();
	}

	private scheduleFlushLoop() {
		const tick = async () => {
			if (
				this.queue.size &&
				performance.now() - this.lastFlushTime >= this.flushInterval &&
				!this.flushing
			) {
				this.flushing = true;
				await this.flushQueue();
				this.flushing = false;
			}
			requestAnimationFrame(tick);
		};
		tick();
	}

	private getKey(data: BlockData): string {
		return `${data.x},${data.y},${data.z}`;
	}
}
