type GameEventHandler = (...args:any) => void;

class GameEventManager {
    private active = false;
    private canvas: HTMLCanvasElement;

    // type -> Map<originalHandler, wrappedHandler>
    private listeners: Map<string, Map<GameEventHandler, EventListener>> = new Map();

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        canvas.onclick= ()=> canvas.requestPointerLock();
        document.addEventListener("pointerlockchange", this.onPointerLockChange);
    }

    private onPointerLockChange = () => {
        this.active = document.pointerLockElement === this.canvas;
    };

    get isActive(): boolean {
        return this.active;
    }

    /**
     * 切换 Pointer Lock 状态
     */
    togglePointerLock() {
        if (document.pointerLockElement === this.canvas) {
            document.exitPointerLock();
        } else {
            this.canvas.requestPointerLock();
        }
    }

    addEventListener(type: string, handler: GameEventHandler) {
        const wrapped: EventListener = (event: Event) => {
            if (this.active) {
                handler(event);
            }
        };

        // 初始化映射结构
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Map());
        }

        // 存入映射表
        this.listeners.get(type)!.set(handler, wrapped);

        window.addEventListener(type, wrapped);
    }

    removeEventListener(type: string, handler: GameEventHandler) {
        const typeMap = this.listeners.get(type);
        if (!typeMap) return;

        const wrapped = typeMap.get(handler);
        if (!wrapped) return;

        window.removeEventListener(type, wrapped);
        typeMap.delete(handler);

        // 清理空的 type 映射
        if (typeMap.size === 0) {
            this.listeners.delete(type);
        }
    }

    destroy() {
        for (const [type, handlerMap] of this.listeners.entries()) {
            for (const wrapped of handlerMap.values()) {
                window.removeEventListener(type, wrapped);
            }
        }
        this.listeners.clear();
        document.removeEventListener("pointerlockchange", this.onPointerLockChange);
    }
}
export default GameEventManager;