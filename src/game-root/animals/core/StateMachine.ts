import { IStateMachineState } from "./types";

/**
 * 状态机系统 - 基于生存战争的StateMachine实现
 * 用于管理动物的行为状态转换
 */
export class StateMachine {
	private states = new Map<string, IStateMachineState>();
	private currentState: string | null = null;
	private previousState: string | null = null;
	private stateStartTime = 0;
	private isTransitioning = false;

	/**
	 * 添加状态
	 */
	public addState(
		name: string,
		onEnter?: () => void,
		onUpdate?: (deltaTime: number) => void,
		onExit?: () => void,
		canTransitionTo?: (targetState: string) => boolean
	): void {
		const state: IStateMachineState = {
			name,
			onEnter,
			onUpdate,
			onExit,
			canTransitionTo,
		};

		this.states.set(name, state);
	}

	/**
	 * 转换到指定状态
	 */
	public transitionTo(stateName: string | null): boolean {
		if (this.isTransitioning) {
			return false;
		}

		// 允许转换到null状态（停止状态机）
		if (stateName === null) {
			this.exitCurrentState();
			this.currentState = null;
			return true;
		}

		const targetState = this.states.get(stateName);
		if (!targetState) {
			console.warn(`State '${stateName}' not found in state machine`);
			return false;
		}

		// 检查当前状态是否允许转换到目标状态
		if (this.currentState) {
			const currentStateObj = this.states.get(this.currentState);
			if (currentStateObj?.canTransitionTo && !currentStateObj.canTransitionTo(stateName)) {
				return false;
			}
		}

		this.isTransitioning = true;

		// 退出当前状态
		this.exitCurrentState();

		// 设置新状态
		this.previousState = this.currentState;
		this.currentState = stateName;
		this.stateStartTime = Date.now();

		// 进入新状态
		try {
			targetState.onEnter?.();
		} catch (error) {
			console.error(`Error entering state '${stateName}':`, error);
		}

		this.isTransitioning = false;
		return true;
	}

	/**
	 * 更新状态机
	 */
	public update(deltaTime: number): void {
		if (!this.currentState || this.isTransitioning) {
			return;
		}

		const state = this.states.get(this.currentState);
		if (state?.onUpdate) {
			try {
				state.onUpdate(deltaTime);
			} catch (error) {
				console.error(`Error updating state '${this.currentState}':`, error);
			}
		}
	}

	/**
	 * 获取当前状态名称
	 */
	public getCurrentState(): string | null {
		return this.currentState;
	}

	/**
	 * 获取前一个状态名称
	 */
	public getPreviousState(): string | null {
		return this.previousState;
	}

	/**
	 * 获取当前状态持续时间
	 */
	public getStateTime(): number {
		if (!this.currentState) return 0;
		return Date.now() - this.stateStartTime;
	}

	/**
	 * 检查是否在指定状态
	 */
	public isInState(stateName: string): boolean {
		return this.currentState === stateName;
	}

	/**
	 * 获取所有状态名称
	 */
	public getStateNames(): string[] {
		return Array.from(this.states.keys());
	}

	/**
	 * 检查状态是否存在
	 */
	public hasState(stateName: string): boolean {
		return this.states.has(stateName);
	}

	/**
	 * 移除状态
	 */
	public removeState(stateName: string): boolean {
		if (this.currentState === stateName) {
			console.warn(`Cannot remove current state '${stateName}'`);
			return false;
		}
		return this.states.delete(stateName);
	}

	/**
	 * 重置状态机
	 */
	public reset(): void {
		this.exitCurrentState();
		this.currentState = null;
		this.previousState = null;
		this.stateStartTime = 0;
		this.isTransitioning = false;
	}

	/**
	 * 获取调试信息
	 */
	public getDebugInfo(): any {
		return {
			currentState: this.currentState,
			previousState: this.previousState,
			stateTime: this.getStateTime(),
			isTransitioning: this.isTransitioning,
			availableStates: this.getStateNames(),
		};
	}

	/**
	 * 清理资源
	 */
	public dispose(): void {
		this.exitCurrentState();
		this.states.clear();
		this.currentState = null;
		this.previousState = null;
		this.stateStartTime = 0;
		this.isTransitioning = false;
	}

	/**
	 * 退出当前状态
	 */
	private exitCurrentState(): void {
		if (!this.currentState) return;

		const state = this.states.get(this.currentState);
		if (state?.onExit) {
			try {
				state.onExit();
			} catch (error) {
				console.error(`Error exiting state '${this.currentState}':`, error);
			}
		}
	}
}

/**
 * 状态机构建器 - 用于简化状态机的创建
 */
export class StateMachineBuilder {
	private stateMachine = new StateMachine();

	/**
	 * 添加状态
	 */
	public addState(
		name: string,
		onEnter?: () => void,
		onUpdate?: (deltaTime: number) => void,
		onExit?: () => void,
		canTransitionTo?: (targetState: string) => boolean
	): StateMachineBuilder {
		this.stateMachine.addState(name, onEnter, onUpdate, onExit, canTransitionTo);
		return this;
	}

	/**
	 * 构建状态机
	 */
	public build(): StateMachine {
		return this.stateMachine;
	}
}

/**
 * 状态机工厂 - 用于创建预定义的状态机
 */
export class StateMachineFactory {
	/**
	 * 创建简单的行为状态机
	 */
	public static createBehaviorStateMachine(): StateMachine {
		return new StateMachineBuilder()
			.addState("Inactive")
			.addState("Active")
			.addState("Transitioning")
			.build();
	}

	/**
	 * 创建动物行为状态机
	 */
	public static createAnimalBehaviorStateMachine(): StateMachine {
		return new StateMachineBuilder()
			.addState("Idle")
			.addState("Walking")
			.addState("Running")
			.addState("Eating")
			.addState("Sleeping")
			.addState("Attacking")
			.addState("Fleeing")
			.build();
	}
}
