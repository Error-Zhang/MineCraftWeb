import React, { useEffect, useState } from "react";
import worldApi, { IWorld } from "@/api/worldApi";
import "./index.less";
import { ScreenPage } from "@/ui-root/views/start-screen";
import GameDialog from "../../../../components/game-dialog";
import GameButton from "@/ui-root/components/game-button";
import WorldFormPanel from "../world-form-panel";
import deleteIcon from "@/assets/icons/delete.svg";
import editIcon from "@/assets/icons/edit.svg";
import backIcon from "@/assets/icons/back.svg";
import doorIcon from "@/assets/icons/door.svg";
import {
	gameModeOptions,
	getLabelByValue,
	seasonOptions,
	worldModeOptions,
	worldViewOptions,
} from "@/ui-root/views/start-screen/components/world-form-panel/constant.ts";
import WorldPlayerPanel from "@/ui-root/views/start-screen/components/world-player-panel";
import playerApi from "@/api/playerApi.ts";
import { gameEventBus } from "@/game-root/events/GameEventBus.ts";
import { GameEvents } from "@/game-root/events/GameEvents.ts";
import gameStore from "@/game-root/events/GameStore.ts";
import GameSelect from "@/ui-root/components/game-select";

const WorldManagerMenu: React.FC<{ setPage: (page: ScreenPage) => void }> = ({ setPage }) => {
	const [worldList, setWorldList] = useState<IWorld[]>([]);
	const [showDialog, setShowDialog] = useState(false);
	const [selectedWorld, setSelectedWorld] = useState<IWorld>({} as any);
	const [showFormPanel, setShowFormPanel] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [showPlayerPanel, setShowPlayerPanel] = useState(false);
	const [worldViewOption, setWorldViewOption] = useState(0);
	const userId = gameStore.get("userInfo")?.id;
	useEffect(() => {
		loadWorlds();
	}, []);

	const loadWorlds = () => {
		worldApi.getWorldList().then(setWorldList);
	};

	const handleRequestDelete = (world: IWorld) => {
		setSelectedWorld(world);
		setShowDialog(true);
	};

	const handleConfirmDelete = async () => {
		if (selectedWorld?.id) {
			await worldApi.deleteWorld(selectedWorld.id);
			setSelectedWorld({} as any);
			setShowDialog(false);
			loadWorlds();
		}
	};

	const handleCancelDelete = () => {
		setShowDialog(false);
		setSelectedWorld({} as any);
	};

	const handleBack = () => {
		setShowFormPanel(false);
		loadWorlds();
	};

	const enterToWorld = async (world: IWorld) => {
		const player = await playerApi.getPlayer(world.id!);
		gameStore.set("worldInfo", {
			playerId: player.id,
			worldId: world.id!,
			gameMode: world.gameMode,
		});
		gameEventBus.emit(GameEvents.startGame);
	};

	const showWorldList = worldList.filter(world => {
		switch (worldViewOption) {
			case 0:
				return world.user?.id === userId;
			case 1:
				return world.isPublic;
			default:
				return true;
		}
	});

	return (
		<div className="world-manager">
			<GameButton className="back-btn" onClick={() => setPage("main")}>
				<img src={backIcon} />
			</GameButton>
			<h2 className="title">世界管理器</h2>
			<GameSelect
				className="world-view-select"
				flex
				label="世界显示"
				value={worldViewOption}
				options={worldViewOptions}
				onChange={v => setWorldViewOption(v)}
			/>
			<div className="world-list">
				{showWorldList.map(world => (
					<div key={world.id} className="world-item">
						<div className="flex-column">
							<span className="world-name">
								{world.worldName}
								{worldViewOption ? `(${world.user?.userName})` : ""}
							</span>
							<div className="world-description">
								<span>{getLabelByValue(gameModeOptions, world.gameMode)}</span>|
								<span>{getLabelByValue(worldModeOptions, world.worldMode)}</span>|
								<span>{getLabelByValue(seasonOptions, world.season)}</span>|
								<span>{world.players?.length}人</span>|<span>{world.createdAt}</span>
							</div>
						</div>
						<div className="btns">
							<GameButton className="entry-btn" onClick={() => enterToWorld(world)}>
								<img src={doorIcon} />
							</GameButton>
							{world.user?.id === userId && (
								<>
									<GameButton
										className="edit-btn"
										onClick={() => {
											setIsEditing(true);
											setSelectedWorld(world);
											setShowFormPanel(true);
										}}
									>
										<img src={editIcon} />
									</GameButton>
									<GameButton className="delete-btn" onClick={() => handleRequestDelete(world)}>
										<img src={deleteIcon} />
									</GameButton>
								</>
							)}
						</div>
					</div>
				))}
			</div>
			<GameButton
				className="create-btn"
				onClick={() => {
					setIsEditing(false);
					setShowFormPanel(true);
				}}
			>
				创建新世界
			</GameButton>

			{showFormPanel && (
				<WorldFormPanel
					world={selectedWorld}
					onSubmit={handleBack}
					onCancel={() => setShowFormPanel(false)}
					isEditing={isEditing}
				/>
			)}
			{showPlayerPanel && (
				<WorldPlayerPanel
					worldId={selectedWorld.id!}
					onEnter={() => enterToWorld(selectedWorld)}
					onBack={() => setShowPlayerPanel(false)}
				/>
			)}
			{showDialog && (
				<GameDialog
					show={showDialog}
					title="删除世界"
					message={`确定要删除 "${selectedWorld?.worldName}" 吗？此操作不可恢复。`}
					onConfirm={handleConfirmDelete}
					onCancel={handleCancelDelete}
				/>
			)}
		</div>
	);
};

export default WorldManagerMenu;
