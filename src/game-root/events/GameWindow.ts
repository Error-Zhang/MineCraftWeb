import { gameEventBus } from "@/game-root/events/GameEventBus.ts";
import { GameEvents } from "@/game-root/events/GameEvents.ts";
import { HandSlotController } from "@/ui-root/components/slot/HandSlotManager.tsx";

type GameEventHandler = (...args: any) => void;

class GameWindow {
	private static instance: GameWindow | null = null;

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

	public get isInGame(): boolean {
		return this.active;
	}

	/**
	 * 获取单例实例，若未初始化则创建
	 */
	public static getInstance(canvas: HTMLCanvasElement): GameWindow {
		if (!GameWindow.instance) {
			GameWindow.instance = new GameWindow(canvas);
		}
		return GameWindow.instance;
	}

	/**
	 * 切换 Pointer Lock 状态
	 */
	public togglePointerLock() {
		if (document.pointerLockElement === this.canvas) {
			document.exitPointerLock();
		} else {
			this.canvas.requestPointerLock();
			gameEventBus.emit(GameEvents.hiddenPanel);
			HandSlotController.clearHandSlot();
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

	public destroy() {
		for (const [type, handlerMap] of this.listeners.entries()) {
			for (const wrapped of handlerMap.values()) {
				window.removeEventListener(type, wrapped);
			}
		}
		this.listeners.clear();
		document.removeEventListener("pointerlockchange", this.onPointerLockChange);
		GameWindow.instance = null;
	}

	private onPointerLockChange = () => {
		this.active = document.pointerLockElement === this.canvas;
	};
}

export default GameWindow;
