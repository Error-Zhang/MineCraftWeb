type GameStoreValue = {
	isSplitting: boolean;
	worldInfo?: {
		worldId: number;
		playerId: number;
		gameMode: number;
	};
	userInfo?: {
		id: number;
		name: string;
	};
};

type GameStoreKey = keyof GameStoreValue;

type Listener<K extends GameStoreKey> = (newValue: GameStoreValue[K]) => void;

class GameStore {
	/** 默认值，用于判断类型（Map 还是普通类型） */
	private static defaultValues: GameStoreValue = {
		isSplitting: false,
	};

	/** 需要持久化存储到 sessionStorage 的字段 */
	private static persistKeys: GameStoreKey[] = ["userInfo"];

	/** 内存存储 */
	private static memoryStore: Partial<GameStoreValue> = {};

	private static listeners = new Map<GameStoreKey, Set<Listener<any>>>();

	/** 从缓存或内存读取 */
	static get<K extends GameStoreKey>(key: K): GameStoreValue[K] {
		// 尝试从持久化存储读取
		if (this.persistKeys.includes(key)) {
			const raw = sessionStorage.getItem(key);
			if (raw) {
				return JSON.parse(raw);
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

				serialized = JSON.stringify(value);

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

	static remove<K extends GameStoreKey>(key: K) {
		if (this.persistKeys.includes(key)) {
			sessionStorage.removeItem(key);
		} else {
			delete this.memoryStore[key];
		}
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
