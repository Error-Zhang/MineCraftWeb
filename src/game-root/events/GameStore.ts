export type GameMode = "creative" | "survival";

type GameStoreValue = {
	gameMode: GameMode;
	interactBlocksStore: Map<any, any>;
	isSplitting: boolean;
	// 可以扩展更多字段
};

type GameStoreKey = keyof GameStoreValue;

type Listener<K extends GameStoreKey> = (newValue: GameStoreValue[K]) => void;

class GameStore {
	/** 默认值，用于判断类型（Map 还是普通类型） */
	private static defaultValues: GameStoreValue = {
		gameMode: "creative",
		interactBlocksStore: new Map<any, any>(),
		isSplitting: false,
	};

	/** 需要持久化存储到 sessionStorage 的字段 */
	private static persistKeys: GameStoreKey[] = ["interactBlocksStore"];

	/** 内存存储 */
	private static memoryStore: Partial<GameStoreValue> = {};

	private static listeners = new Map<GameStoreKey, Set<Listener<any>>>();

	/** 从缓存或内存读取 */
	static get<K extends GameStoreKey>(key: K): GameStoreValue[K] {
		// 尝试从持久化存储读取
		if (this.persistKeys.includes(key)) {
			const raw = sessionStorage.getItem(key);
			if (raw) {
				const parsed = JSON.parse(raw);
				const defaultValue = this.defaultValues[key];

				if (defaultValue instanceof Map) {
					return new Map(parsed) as GameStoreValue[K];
				}
				return parsed;
			}
		}

		// 从内存读取
		if (key in this.memoryStore) {
			return this.memoryStore[key] as GameStoreValue[K];
		}

		// 返回默认值
		return this.defaultValues[key];
	}

	/** 写入缓存或内存并通知监听器 */
	static set<K extends GameStoreKey>(key: K, value: GameStoreValue[K]) {
		// 持久化存储
		if (this.persistKeys.includes(key)) {
			try {
				let serialized: string;

				if (value instanceof Map) {
					serialized = JSON.stringify(Array.from(value.entries()));
				} else {
					serialized = JSON.stringify(value);
				}

				sessionStorage.setItem(key, serialized);
			} catch (e) {
				console.error(`[GameStore] Failed to persist value for key ${key}:`, e);
			}
		} else {
			// 内存存储
			this.memoryStore[key] = value;
		}

		this.notify(key, value);
	}

	/** 单独操作 interactBlocksStore 的便捷方法 */
	static getInteractBlocksStore(guid: string) {
		const store = this.get("interactBlocksStore");
		return store.get(guid);
	}

	static setInteractBlocksStore(guid: string, data: any) {
		const store = this.get("interactBlocksStore");
		store.set(guid, data);
		this.set("interactBlocksStore", store);
	}

	static on<K extends GameStoreKey>(key: K, callback: Listener<K>) {
		if (!this.listeners.has(key)) {
			this.listeners.set(key, new Set());
		}
		this.listeners.get(key)!.add(callback as any);
	}

	static off<K extends GameStoreKey>(key: K, callback: Listener<K>) {
		this.listeners.get(key)?.delete(callback as any);
	}

	/** 清除所有内存存储的数据 */
	static clearMemory() {
		this.memoryStore = {};
	}

	private static notify<K extends GameStoreKey>(key: K, value: GameStoreValue[K]) {
		this.listeners.get(key)?.forEach(cb => cb(value));
	}
}

export default GameStore;
