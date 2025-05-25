import {
	Color3,
	Color4,
	ImportMeshAsync,
	Mesh,
	MeshBuilder,
	PointerEventTypes,
	Scene,
	StandardMaterial,
	TransformNode,
	Vector3,
} from "@babylonjs/core";
import { AdvancedDynamicTexture, Control, Rectangle } from "@babylonjs/gui";
import { DebugHelper } from "@/game-root/utils/DebugHelper.ts";
import { PlayerCamera } from "@/game-root/player/PlayerCamera.ts";
import MathUtils from "@/game-root/utils/MathUtils.ts";
import { playerEvents } from "@/game-root/events";
import { usePlayerStore, useWorldStore } from "@/store";

export class Player {
	// 场景、相机、世界等
	scene: Scene;
	camera: PlayerCamera;
	debugHelper: DebugHelper;

	// 玩家模型
	player: Mesh | undefined;

	maxPlaceDistance = 12; // 最大方块放置距离
	private unsubscribe?: Function;

	constructor(scene: Scene, canvas: HTMLCanvasElement) {
		this.scene = scene;

		this.camera = new PlayerCamera(scene, canvas);

		this.addEventListener();
		this.addCrossHair();
		this.showBlockHoverOutline();

		this.debugHelper = new DebugHelper(scene);
		this.debugHelper.createAxisHelper();
	}

	private get worldController() {
		return useWorldStore.getState().worldController!;
	}

	dispose() {
		playerEvents.off("placeBlack", this.placeBlock.bind(this));
		playerEvents.off("destroyBlock", this.destroyBlock.bind(this));
		playerEvents.off("interactBlock", this.interactWithBlock.bind(this));
		this.unsubscribe?.();
		usePlayerStore.getState().reset();
	}

	// 处理键盘输入
	private addEventListener() {
		playerEvents.on("placeBlack", this.placeBlock.bind(this));
		playerEvents.on("destroyBlock", this.destroyBlock.bind(this));
		playerEvents.on("interactBlock", this.interactWithBlock.bind(this));
		// 订阅玩家位置变化
		this.unsubscribe = usePlayerStore.subscribe(state => {
			const { x, z } = state.position;
			this.worldController.updateChunk(x, z);
		});
	}

	// 加载玩家模型
	private async loadPlayerModel(modelPath: string) {
		const { meshes } = await ImportMeshAsync(modelPath, this.scene);
		const collider = this.createPlayerCollider();
		const playerModel = new TransformNode("player", this.scene);
		meshes.forEach(mesh => {
			mesh.isPickable = false;
			mesh.setParent(playerModel);
		});
		playerModel.parent = collider;
		playerModel.position.y = -0.7; // 半高对齐
		this.player = collider;
	}

	// 创建玩家碰撞体
	private createPlayerCollider(): Mesh {
		const collider = MeshBuilder.CreateBox(
			"playerCollider",
			{
				width: 0.4,
				depth: 0.2,
				height: 1.7,
			},
			this.scene
		);
		collider.position = new Vector3(1, 2, 1);
		collider.checkCollisions = true;
		collider.isVisible = false;
		collider.isPickable = false;
		return collider;
	}

	private getTargetBlockInfo() {
		const pick = this.camera.getPickInfo(this.maxPlaceDistance);
		if (!pick) return null;

		const faceNormal = pick.getNormal(true);
		if (!faceNormal) return null;

		const pickedPos = pick.pickedPoint!;
		const currentBlockPos = this.getCurrentBlockPos(pickedPos, faceNormal);

		return { faceNormal, currentBlockPos };
	}

	// 与方块交互
	private interactWithBlock() {
		const info = this.getTargetBlockInfo();
		if (!info) return;

		const block = this.worldController.getBlock(info.currentBlockPos);
		block?.behavior?.onInteract?.();
	}

	// 放置方块
	private placeBlock(blockId: number) {
		const info = this.getTargetBlockInfo();
		if (!info) return;

		const placePos = info.currentBlockPos.add(info.faceNormal);
		this.worldController.setBlock(placePos, blockId);
	}

	// 销毁方块
	private destroyBlock() {
		const info = this.getTargetBlockInfo();
		if (!info) return;

		this.worldController.setBlock(info.currentBlockPos, 0);
	}

	private showBlockHoverOutline() {
		let highlightBox: Mesh | null = null;

		// 创建高亮盒子（只创建一次）
		highlightBox = MeshBuilder.CreateBox("hoverBox", { size: 1 }, this.scene);
		const mat = new StandardMaterial("outlineMat", this.scene);
		mat.emissiveColor = new Color3(1, 1, 1); // 白色发光

		highlightBox.material = mat;
		highlightBox.isPickable = false;
		highlightBox.setEnabled(false); // 初始隐藏
		highlightBox.enableEdgesRendering(); // 开启边框渲染
		highlightBox.edgesWidth = 2;
		highlightBox.edgesColor = new Color4(1, 1, 1, 1); // 白色边框
		highlightBox.material.alpha = 0; // 使本体透明

		this.scene.onPointerObservable.add(pointerInfo => {
			if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
				const pickResult = this.camera.getPickInfo(this.maxPlaceDistance);
				const pickedPoint = pickResult?.pickedPoint;
				const normal = pickResult?.getNormal();

				if (pickedPoint && normal) {
					// 转换为整数网格坐标（向下取整）
					const currentPos = this.getCurrentBlockPos(pickedPoint, normal);

					// 将 highlightBox 移动到方块中心位置
					highlightBox.position.set(currentPos.x + 0.5, currentPos.y + 0.5, currentPos.z + 0.5);
					highlightBox.setEnabled(true);
				} else {
					highlightBox.setEnabled(false); // 没有拾取到方块，隐藏高亮框
				}
			}
		});
	}

	// 计算当前方块位置
	private getCurrentBlockPos(pickedPos: Vector3, faceNormal: Vector3): Vector3 {
		return new Vector3(
			MathUtils.correct(pickedPos.x, faceNormal.x),
			MathUtils.correct(pickedPos.y, faceNormal.y),
			MathUtils.correct(pickedPos.z, faceNormal.z)
		);
	}

	// 在屏幕中心添加一个十字形准星
	private addCrossHair(size = 8, color = "white") {
		const ui = AdvancedDynamicTexture.CreateFullscreenUI("CrosshairUI", true, this.scene);
		const thickness = 1.5;
		const createLine = (x: number, y: number, width: number, height: number) => {
			const line = new Rectangle();
			line.width = `${width}px`;
			line.height = `${height}px`;
			line.color = color;
			line.thickness = thickness;
			line.background = color;
			line.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
			line.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
			line.left = `${x}px`;
			line.top = `${y}px`;
			return line;
		};

		const half = size / 2;
		ui.addControl(createLine(0, -half - 2, thickness, size)); // 上
		ui.addControl(createLine(0, half + 2, thickness, size)); // 下
		ui.addControl(createLine(-half - 2, 0, size, thickness)); // 左
		ui.addControl(createLine(half + 2, 0, size, thickness)); // 右
	}
}
