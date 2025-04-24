import {GameEvents} from "@/enums/GameEvents.ts";

type EventCallback = (...args: any[]) => void;

class EventBus {
    private events: Map<GameEvents, EventCallback[]> = new Map();

    on(event: GameEvents, callback: EventCallback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)!.push(callback);
    }

    off(event: GameEvents, callback: EventCallback) {
        const listeners = this.events.get(event);
        if (listeners) {
            this.events.set(event, listeners.filter(cb => cb !== callback));
        }
    }

    emit(event: GameEvents, data?: object, callback?: EventCallback) {
        const listeners = this.events.get(event);
        if (listeners) {
            listeners.forEach(cb => cb(data, callback));
        }
    }

    clear() {
        this.events.clear();
    }
}

const eventBus = new EventBus();
export default eventBus;
