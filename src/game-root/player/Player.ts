import {
	ArcRotateCamera,
	Color4,
	ImportMeshAsync,
	Mesh,
	MeshBuilder,
	PointerEventTypes,
	Scene,
	TransformNode,
	Vector3,
} from "@babylonjs/core";
import { AdvancedDynamicTexture, Control, Rectangle } from "@babylonjs/gui";
import { Assets } from "@/assets";
import { gameEventBus } from "@/game-root/events/GameEventBus.ts";
import { GameEvents } from "@/game-root/events/GameEvents.ts";
import { Blocks } from "@/blocks/core/Blocks.ts";
import { World } from "@/game-root/world/World.ts";
import blockFactory from "@/blocks/core/BlockFactory.ts";
import AirBlock from "@/blocks/natures/AirBlock.ts";
import { DebugHelper } from "@/game-root/utils/DebugHelper.ts";
import { correct } from "@/game-root/utils/CalcHelper.ts";
import GameListener from "@/game-root/events/GameListener.ts";
import { CharacterController } from "./CharacterController.ts";
import { GameMode } from "@/game-root/events/GameStore.ts";
import { IInteractableBlock } from "@/blocks/core/BlockInterfaces.ts";

export class Player {
	// 场景、相机、世界等
	scene: Scene;
	camera: ArcRotateCamera | undefined;
	world: World;
	gameEventManager: GameListener;
	debugHelper: DebugHelper;

	// 玩家模型
	player: Mesh | undefined;
	gameMode: GameMode;

	maxPlaceDistance = 12; // 最大方块放置距离

	constructor(scene: Scene, canvas: HTMLCanvasElement, world: World, gameMode: GameMode) {
		this.scene = scene;
		this.world = world;
		this.gameMode = gameMode;
		this.setupCamera(canvas);
		this.gameEventManager = new GameListener(canvas);
		this.addEventListener();
		this.addCrossHair(); // 添加十字准星
		this.loadPlayerModel(Assets.playerModel).then(() => {
			const cc = new CharacterController(
				this.player!,
				this.camera!,
				this.scene,
				this.gameEventManager
			);
			cc.setCameraTarget(new Vector3(0, 0.7, 0));

			cc.setNoFirstPerson(false); // 启用第一人称切换
			cc.setStepOffset(0.4); // 可跨越的最大台阶高度
			cc.setSlopeLimit(30, 60); // 设置坡度限制，过陡将滑下

			cc.start();
		});
		this.showBlockHoverOutline();
		this.debugHelper = new DebugHelper(scene);
		this.debugHelper.createAxisHelper();
	}

	setupCamera(canvas: HTMLCanvasElement) {
		const camera = new ArcRotateCamera(
			"PlayerCamera", // 相机名称
			Math.PI / 4, // 初始 alpha（绕 Y轴）
			Math.PI / 4, // 初始 beta（绕 X轴）
			0, // 相机和目标点之间的距离
			Vector3.Zero(), // 目标点（通常是玩家位置）
			this.scene // 场景对象
		);
		// 基本设置
		camera.wheelPrecision = 15;
		camera.checkCollisions = false;
		camera.attachControl(canvas, false);

		// 限制相机与玩家的最远最近距离
		camera.lowerRadiusLimit = 2;
		camera.upperRadiusLimit = 20;

		// 降低鼠标旋转灵敏度
		camera.angularSensibilityX = 1500; // 水平灵敏度（默认是1000）
		camera.angularSensibilityY = 1500; // 垂直灵敏度

		// 抑制旋转惯性（去漂移）
		camera.inertia = 0.6; // 默认为 0.9，值越小越“硬”，0则无惯性

		camera.attachControl(canvas, false);
		this.camera = camera;
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

	// 显示方块悬浮的边缘轮廓
	showBlockHoverOutline() {
		let lastHovered: Mesh | null = null;
		this.scene.onPointerObservable.add(pointerInfo => {
			if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
				const pickResult = this.getPickInfo();
				const picked = pickResult?.pickedMesh ?? null;

				if (picked !== lastHovered) {
					if (lastHovered && lastHovered.edgesRenderer) {
						lastHovered.edgesRenderer.isEnabled = false;
					}

					if (picked && picked.edgesRenderer) {
						// 设置边框
						picked.edgesRenderer.isEnabled = true;
						picked.edgesWidth = 1;
						picked.edgesColor = new Color4(255, 255, 255, 1);
					}

					lastHovered = picked as Mesh;
				}
			}
		});
	}

	// 与方块交互
	interactWithBlock() {
		const pick = this.getPickInfo();
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
		const pick = this.getPickInfo();
		if (!pick) return;

		const faceNormal = pick.getNormal(true);
		if (!faceNormal) return;

		const pickedPos = pick.pickedPoint!;
		const target = this.getCurrentBlockPos(pickedPos, faceNormal).add(faceNormal);
		const block = blockFactory.createBlock(this.scene, blockType, target);

		if (this.world.setBlockGlobal(block)) {
			callback();
		}
	}

	// 销毁方块
	destroyBlock() {
		const pick = this.getPickInfo();
		if (!pick) return;

		const faceNormal = pick.getNormal(true);
		if (!faceNormal) return;

		const pickedPos = pick.pickedPoint!;
		const target = this.getCurrentBlockPos(pickedPos, faceNormal);

		this.world.setBlockGlobal(new AirBlock(this.scene, target));
	}

	// 计算当前方块位置
	getCurrentBlockPos(pickedPos: Vector3, faceNormal: Vector3): Vector3 {
		return new Vector3(
			correct(pickedPos.x, faceNormal.x),
			correct(pickedPos.y, faceNormal.y),
			correct(pickedPos.z, faceNormal.z)
		);
	}

	// 射线拾取选中的方块信息，排除玩家自身碰撞体
	private getPickInfo() {
		const ray = this.camera!.getForwardRay();
		const pick = this.scene.pickWithRay(ray, mesh => {
			return mesh.isPickable;
		});

		if (pick?.hit && pick.pickedPoint && pick.distance <= this.maxPlaceDistance) {
			return pick;
		}

		return null;
	}
}
