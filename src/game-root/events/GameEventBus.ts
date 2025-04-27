import {GameEvents} from "@/game-root/events/GameEvents.ts";

type EventCallback = (...args: any[]) => void;

class GameEventBus {
    private events: Map<GameEvents | string, EventCallback[]> = new Map();

    on(event: GameEvents | string, callback: EventCallback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)!.push(callback);
    }

    off(event: GameEvents | string, callback: EventCallback) {
        const listeners = this.events.get(event);
        if (listeners) {
            this.events.set(event, listeners.filter(cb => cb !== callback));
        }
    }

    emit(event: GameEvents | string, data?: object, callback?: EventCallback) {
        const listeners = this.events.get(event);
        if (listeners) {
            listeners.forEach(cb => cb(data, callback));
        }
    }

    clear() {
        this.events.clear();
    }
}

const gameEventBus = new GameEventBus();

export default gameEventBus;
