export class Singleton {
	private static instances = new Map<Function, unknown>();

	/**
	 * 创建单例实例
	 */
	public static create<T extends SingleClass, C extends new (...args: any[]) => T>(
		clazz: C,
		...args: ConstructorParameters<C>
	): T {
		if (this.instances.has(clazz)) {
			return <T>this.instances.get(clazz);
		}
		const instance = Reflect.construct(clazz, args);
		this.instances.set(clazz, instance);
		return instance;
	}

	/**
	 * 获取单例（必须已通过 create 创建）
	 */
	protected static getInstance<T extends SingleClass>(clazz: new (...args: any[]) => T) {
		if (!this.instances.has(clazz)) {
			throw new Error("Singleton not initialized. Call create() first.");
		}
		return <T>this.instances.get(clazz);
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
}
