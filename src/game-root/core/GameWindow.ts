type GameEventHandler = (...args: any) => void;

class GameWindow {
	private static instance: GameWindow;

	private active = false;
	private canvas: HTMLCanvasElement;
	private listeners: Map<string, Map<GameEventHandler, EventListener>> = new Map();

	private constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;

		canvas.onclick = () => {
			if (!this.active) {
				this.togglePointerLock();
			}
		};

		document.addEventListener("pointerlockchange", this.onPointerLockChange);
	}

	public static get Instance() {
		return this.instance;
	}

	public get isInGame(): boolean {
		return this.active;
	}

	/**
	 * 获取单例实例，若未初始化则创建
	 */
	public static create(canvas: HTMLCanvasElement): GameWindow {
		if (!this.instance) {
			this.instance = new this(canvas);
		}
		return this.instance;
	}

	/**
	 * 切换 Pointer Lock 状态
	 */
	public togglePointerLock() {
		if (document.pointerLockElement === this.canvas) {
			document.exitPointerLock();
		} else {
			this.canvas.requestPointerLock();
		}
	}

	public addEventListener(type: string, handler: GameEventHandler) {
		const wrapped: EventListener = (event: Event) => {
			if (this.active) {
				handler(event);
			}
		};

		if (!this.listeners.has(type)) {
			this.listeners.set(type, new Map());
		}

		this.listeners.get(type)!.set(handler, wrapped);
		window.addEventListener(type, wrapped);
	}

	public removeEventListener(type: string, handler: GameEventHandler) {
		const typeMap = this.listeners.get(type);
		if (!typeMap) return;

		const wrapped = typeMap.get(handler);
		if (!wrapped) return;

		window.removeEventListener(type, wrapped);
		typeMap.delete(handler);

		if (typeMap.size === 0) {
			this.listeners.delete(type);
		}
	}

	public dispose() {
		for (const [type, handlerMap] of this.listeners.entries()) {
			for (const wrapped of handlerMap.values()) {
				window.removeEventListener(type, wrapped);
			}
		}
		this.listeners.clear();
	}

	private onPointerLockChange = () => {
		this.active = document.pointerLockElement === this.canvas;
	};
}

export default GameWindow;
