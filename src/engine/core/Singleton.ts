class Singleton {
	private static instances = new Map<Function, unknown>();

	/**
	 * 获取单例（必须已通过 create 创建）
	 */
	protected static getInstance<T extends SingleClass>(clazz: new (...args: any[]) => T) {
		if (!this.instances.has(clazz)) {
			throw new Error("Singleton not initialized. Call create() first.");
		}
		return <T>this.instances.get(clazz);
	}

	/**
	 * 创建单例实例
	 */
	protected static create<T extends SingleClass>(
		clazz: new (...args: any[]) => T,
		...args: ConstructorParameters<typeof clazz>
	): T {
		if (this.instances.has(clazz)) {
			return <T>this.instances.get(clazz);
		}
		const instance = Reflect.construct(clazz, args);
		this.instances.set(clazz, instance);
		return instance;
	}
}

export class SingleClass extends Singleton {
	/**
	 * 获取单例（必须已通过 create 创建）
	 */
	public static get Instance() {
		return this.getInstance();
	}

	/**
	 * 获取单例（必须已通过 create 创建）
	 */
	public static getInstance<T extends SingleClass>() {
		return <T>super.getInstance(this);
	}

	/**
	 * 创建单例实例
	 */
	public static create<T extends SingleClass>(
		...args: ConstructorParameters<new (...args: any[]) => T>
	): T {
		return <T>super.create(this, ...args);
	}
}
