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
import { gameEventBus } from "@/game-root/events/GameEventBus.ts";
import { GameEvents } from "@/game-root/events/GameEvents.ts";
import { Blocks } from "@/blocks/core/Blocks.ts";
import { World } from "@/game-root/world/World.ts";
import blockFactory from "@/blocks/core/BlockFactory.ts";
import AirBlock from "@/blocks/natures/AirBlock.ts";
import { DebugHelper } from "@/game-root/utils/DebugHelper.ts";

import { IInteractableBlock } from "@/blocks/core/BlockInterfaces.ts";
import { PlayerCamera } from "@/game-root/player/PlayerCamera.ts";
import { GameOption } from "@/game-root/Game.ts";
import MathUtils from "@/game-root/utils/MathUtils.ts";

export class Player {
	// 场景、相机、世界等
	scene: Scene;
	camera: PlayerCamera;
	world: World;
	debugHelper: DebugHelper;

	// 玩家模型
	player: Mesh | undefined;

	maxPlaceDistance = 12; // 最大方块放置距离

	constructor(scene: Scene, canvas: HTMLCanvasElement, world: World, option: GameOption) {
		this.scene = scene;
		this.world = world;

		this.camera = new PlayerCamera(scene, canvas, option);

		this.addEventListener();
		this.addCrossHair();
		this.showBlockHoverOutline();

		this.debugHelper = new DebugHelper(scene);
		this.debugHelper.createAxisHelper();
	}

	// 处理键盘输入
	addEventListener() {
		gameEventBus.on(GameEvents.placeBlack, this.placeBlock.bind(this));
		gameEventBus.on(GameEvents.destroyBlock, this.destroyBlock.bind(this));
		gameEventBus.on(GameEvents.onInteract, this.interactWithBlock.bind(this));
	}

	dispose() {
		gameEventBus.off(GameEvents.placeBlack, this.placeBlock.bind(this));
		gameEventBus.off(GameEvents.destroyBlock, this.destroyBlock.bind(this));
		gameEventBus.off(GameEvents.onInteract, this.interactWithBlock.bind(this));
	}

	// 加载玩家模型
	async loadPlayerModel(modelPath: string) {
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
	createPlayerCollider(): Mesh {
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

	// 与方块交互
	interactWithBlock() {
		const pick = this.camera.getPickInfo(this.maxPlaceDistance);
		if (!pick) return;

		const pickedPos = pick.pickedPoint!;
		const faceNormal = pick.getNormal(true);
		if (!faceNormal) return;

		const targetPos = this.getCurrentBlockPos(pickedPos, faceNormal); // 当前方块坐标
		const block = this.world.getBlockGlobal(targetPos) as unknown as IInteractableBlock;
		block.onInteract?.();
	}

	// 放置方块
	placeBlock({ blockType }: { blockType: Blocks }, callback: () => void) {
		const pick = this.camera.getPickInfo(this.maxPlaceDistance);
		if (!pick) return;

		const faceNormal = pick.getNormal(true);
		if (!faceNormal) return;

		const pickedPos = pick.pickedPoint!;
		const target = this.getCurrentBlockPos(pickedPos, faceNormal).add(faceNormal);
		const block = blockFactory.createBlock(this.scene, blockType, target)!;

		if (this.world.setBlockGlobal(block)) {
			callback();
		}
	}

	// 销毁方块
	destroyBlock() {
		const pick = this.camera.getPickInfo(this.maxPlaceDistance);
		if (!pick) return;

		const faceNormal = pick.getNormal(true);
		if (!faceNormal) return;

		const pickedPos = pick.pickedPoint!;
		const target = this.getCurrentBlockPos(pickedPos, faceNormal);

		this.world.setBlockGlobal(new AirBlock(this.scene, target));
	}

	showBlockHoverOutline() {
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
	getCurrentBlockPos(pickedPos: Vector3, faceNormal: Vector3): Vector3 {
		return new Vector3(
			MathUtils.correct(pickedPos.x, faceNormal.x),
			MathUtils.correct(pickedPos.y, faceNormal.y),
			MathUtils.correct(pickedPos.z, faceNormal.z)
		);
	}

	// 在屏幕中心添加一个十字形准星
	addCrossHair(size = 8, color = "white") {
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
