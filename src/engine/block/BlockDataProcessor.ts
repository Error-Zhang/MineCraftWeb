export class BlockDataProcessor {
	public static readonly MAX_ID = 4095;

	private static readonly ID_BITS = 12;
	private static readonly ROT_BITS = 2;
	private static readonly COLOR_BITS = 8;

	private static readonly ID_MASK = (1 << this.ID_BITS) - 1; // 0x00000FFF
	private static readonly ROT_MASK = (1 << this.ROT_BITS) - 1; // 0x00000003
	private static readonly COLOR_MASK = (1 << this.COLOR_BITS) - 1; // 0x000000FF

	private static readonly ROT_SHIFT = this.ID_BITS;
	private static readonly COLOR_SHIFT = this.ROT_SHIFT + this.ROT_BITS;
	private static readonly CUSTOM_SHIFT = this.COLOR_SHIFT + this.COLOR_BITS;

	// -------------------
	// 编码
	// -------------------
	static encode(id: number, rotation: number = 0, color: number = 0, custom: number = 0): number {
		if (id < 0 || id > this.MAX_ID) throw new Error("Invalid blockId");
		if (rotation < 0 || rotation >= 1 << this.ROT_BITS) throw new Error("Invalid rotation");
		if (color < 0 || color >= 1 << this.COLOR_BITS) throw new Error("Invalid color");
		if (custom < 0 || custom >= 1 << (32 - this.CUSTOM_SHIFT))
			throw new Error("Custom data overflow");

		return (
			(id & this.ID_MASK) |
			((rotation & this.ROT_MASK) << this.ROT_SHIFT) |
			((color & this.COLOR_MASK) << this.COLOR_SHIFT) |
			(custom << this.CUSTOM_SHIFT)
		);
	}

	// -------------------
	// 解码
	// -------------------
	static decode(data: number) {
		return {
			id: this.getId(data),
			rotation: this.getRotation(data),
			color: this.getColor(data),
			custom: this.getCustom(data),
		};
	}

	// -------------------
	// 设置单项
	// -------------------
	static setId(data: number, id: number): number {
		return (data & ~this.ID_MASK) | (id & this.ID_MASK);
	}

	static setRotation(data: number, rot: 0 | 1 | 2 | 3): number {
		return (data & ~(this.ROT_MASK << this.ROT_SHIFT)) | ((rot & this.ROT_MASK) << this.ROT_SHIFT);
	}

	static setColor(data: number, color: number): number {
		return (
			(data & ~(this.COLOR_MASK << this.COLOR_SHIFT)) |
			((color & this.COLOR_MASK) << this.COLOR_SHIFT)
		);
	}

	static setCustom(data: number, custom: number): number {
		return (data & ((1 << this.CUSTOM_SHIFT) - 1)) | (custom << this.CUSTOM_SHIFT);
	}

	// -------------------
	// 获取单项
	// -------------------
	static getId(data: number): number {
		if (data < this.MAX_ID) return data;
		return data & this.ID_MASK;
	}

	static getRotation(data: number): 0 | 1 | 2 | 3 {
		return ((data >> this.ROT_SHIFT) & this.ROT_MASK) as 0 | 1 | 2 | 3;
	}

	static getColor(data: number): number {
		return (data >> this.COLOR_SHIFT) & this.COLOR_MASK;
	}

	static getCustom(data: number): number {
		return data >>> this.CUSTOM_SHIFT;
	}
}
