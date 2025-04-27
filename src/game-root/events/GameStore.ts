export type GameMode = "creative" | "survival"

type GameStoreValue = {
    gameMode: GameMode;
};

type GameStoreKey = keyof GameStoreValue;

type Listener<K extends GameStoreKey> = (newValue: GameStoreValue[K]) => void;

class GameStore {
    private static listeners = new Map<GameStoreKey, Set<Listener<any>>>();

    static get<K extends GameStoreKey>(key: K): GameStoreValue[K] | null {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    }

    static set<K extends GameStoreKey>(key: K, value: GameStoreValue[K]) {
        sessionStorage.setItem(key, JSON.stringify(value));
        this.notify(key, value);
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

    private static notify<K extends GameStoreKey>(key: K, value: GameStoreValue[K]) {
        this.listeners.get(key)?.forEach(cb => cb(value));
    }
}

export default GameStore;
