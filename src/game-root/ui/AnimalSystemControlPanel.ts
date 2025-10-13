import { AdvancedDynamicTexture, Button, Control, Rectangle, StackPanel, TextBlock } from "@babylonjs/gui";
import { GameConfig } from "@/game-root/config/GameConfig";

/**
 * 动物系统控制面板
 * 提供可视化的开关控制
 */
export class AnimalSystemControlPanel {
	private advancedTexture: AdvancedDynamicTexture;
	private panel: StackPanel;
	private isVisible: boolean = false;

	constructor(advancedTexture: AdvancedDynamicTexture) {
		this.advancedTexture = advancedTexture;
		this.panel = this.createPanel();
		this.panel.isVisible = false;
	}

	/**
	 * 创建控制面板
	 */
	private createPanel(): StackPanel {
		// 主容器
		const container = new Rectangle("animalControlContainer");
		container.width = "300px";
		container.height = "400px";
		container.cornerRadius = 10;
		container.color = "white";
		container.thickness = 2;
		container.background = "rgba(0, 0, 0, 0.8)";
		container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		container.top = "10px";
		container.left = "-10px";
		this.advancedTexture.addControl(container);

		// 面板
		const panel = new StackPanel("animalControlPanel");
		panel.width = "280px";
		container.addControl(panel);

		// 标题
		const title = new TextBlock("title", "动物系统控制");
		title.height = "40px";
		title.color = "white";
		title.fontSize = 18;
		title.fontWeight = "bold";
		panel.addControl(title);

		// 分隔线
		this.addSeparator(panel);

		// 主开关
		this.addToggleButton(
			panel,
			"启用动物系统",
			() => GameConfig.isAnimalSystemEnabled(),
			(enabled) => {
				GameConfig.setAnimalSystemEnabled(enabled);
				this.refreshPanel();
			}
		);

		// AI开关
		this.addToggleButton(
			panel,
			"启用动物AI",
			() => GameConfig.ANIMAL_SYSTEM.enableAI,
			(enabled) => GameConfig.setAnimalAIEnabled(enabled)
		);

		// 网络同步开关
		this.addToggleButton(
			panel,
			"网络同步",
			() => GameConfig.ANIMAL_SYSTEM.enableNetworkSync,
			(enabled) => {
				GameConfig.ANIMAL_SYSTEM.enableNetworkSync = enabled;
				console.log(`Network sync ${enabled ? "enabled" : "disabled"}`);
			}
		);

		// 调试模式开关
		this.addToggleButton(
			panel,
			"调试模式",
			() => GameConfig.ANIMAL_SYSTEM.debugMode,
			(enabled) => GameConfig.setDebugMode(enabled)
		);

		// 分隔线
		this.addSeparator(panel);

		// 性能预设按钮
		const perfTitle = new TextBlock("perfTitle", "性能预设");
		perfTitle.height = "30px";
		perfTitle.color = "white";
		perfTitle.fontSize = 14;
		panel.addControl(perfTitle);

		this.addActionButton(panel, "高性能", () => this.setPerformanceMode("high"));
		this.addActionButton(panel, "中等性能", () => this.setPerformanceMode("medium"));
		this.addActionButton(panel, "低性能", () => this.setPerformanceMode("low"));

		// 关闭按钮
		this.addSeparator(panel);
		this.addActionButton(panel, "关闭面板", () => this.hide(), "red");

		return panel;
	}

	/**
	 * 添加切换按钮
	 */
	private addToggleButton(
		panel: StackPanel,
		label: string,
		getState: () => boolean,
		onToggle: (enabled: boolean) => void
	): void {
		const button = Button.CreateSimpleButton(`btn_${label}`, label);
		button.width = "260px";
		button.height = "40px";
		button.color = "white";
		button.fontSize = 14;
		button.cornerRadius = 5;
		button.thickness = 2;
		button.paddingTop = "5px";
		button.paddingBottom = "5px";

		const updateButtonState = () => {
			const enabled = getState();
			button.background = enabled ? "green" : "gray";
			button.textBlock!.text = `${label}: ${enabled ? "开" : "关"}`;
		};

		updateButtonState();

		button.onPointerClickObservable.add(() => {
			const currentState = getState();
			onToggle(!currentState);
			updateButtonState();
		});

		panel.addControl(button);
	}

	/**
	 * 添加操作按钮
	 */
	private addActionButton(
		panel: StackPanel,
		label: string,
		onClick: () => void,
		color: string = "blue"
	): void {
		const button = Button.CreateSimpleButton(`btn_${label}`, label);
		button.width = "260px";
		button.height = "35px";
		button.color = "white";
		button.background = color;
		button.fontSize = 14;
		button.cornerRadius = 5;
		button.thickness = 2;
		button.paddingTop = "3px";
		button.paddingBottom = "3px";

		button.onPointerClickObservable.add(onClick);

		panel.addControl(button);
	}

	/**
	 * 添加分隔线
	 */
	private addSeparator(panel: StackPanel): void {
		const separator = new Rectangle("separator");
		separator.width = "260px";
		separator.height = "2px";
		separator.background = "white";
		separator.thickness = 0;
		separator.paddingTop = "5px";
		separator.paddingBottom = "5px";
		panel.addControl(separator);
	}

	/**
	 * 设置性能模式
	 */
	private setPerformanceMode(mode: "high" | "medium" | "low"): void {
		switch (mode) {
			case "high":
				GameConfig.ANIMAL_SYSTEM.performance.maxUpdatePerFrame = 100;
				GameConfig.ANIMAL_SYSTEM.performance.chunkLoadRadius = 4;
				GameConfig.ANIMAL_SYSTEM.performance.syncInterval = 100;
				break;
			case "medium":
				GameConfig.ANIMAL_SYSTEM.performance.maxUpdatePerFrame = 50;
				GameConfig.ANIMAL_SYSTEM.performance.chunkLoadRadius = 3;
				GameConfig.ANIMAL_SYSTEM.performance.syncInterval = 200;
				break;
			case "low":
				GameConfig.ANIMAL_SYSTEM.performance.maxUpdatePerFrame = 20;
				GameConfig.ANIMAL_SYSTEM.performance.chunkLoadRadius = 2;
				GameConfig.ANIMAL_SYSTEM.performance.syncInterval = 500;
				break;
		}
		console.log(`性能模式已设置为: ${mode}`);
	}

	/**
	 * 刷新面板状态
	 */
	private refreshPanel(): void {
		// 重新创建面板以更新所有按钮状态
		this.panel.dispose();
		this.panel = this.createPanel();
		this.panel.isVisible = this.isVisible;
	}

	/**
	 * 显示面板
	 */
	public show(): void {
		this.isVisible = true;
		this.panel.isVisible = true;
	}

	/**
	 * 隐藏面板
	 */
	public hide(): void {
		this.isVisible = false;
		this.panel.isVisible = false;
	}

	/**
	 * 切换显示/隐藏
	 */
	public toggle(): void {
		if (this.isVisible) {
			this.hide();
		} else {
			this.show();
		}
	}

	/**
	 * 销毁面板
	 */
	public dispose(): void {
		this.panel.dispose();
	}
}
