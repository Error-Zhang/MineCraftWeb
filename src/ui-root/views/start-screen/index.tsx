import React, { ReactNode, useEffect, useRef, useState } from "react";
import "./index.less";
import { useDroneBackgroundMotion } from "@/ui-root/hooks/useDroneBackgroundMotion.tsx";
import DroneOverlayGrid from "./DroneOverlayGrid.tsx";
import MainMenu from "./MainMenu.tsx";
import WorldManagerMenu from "./world-manager-menu";
import { useGameStore } from "@/store";

export type ScreenPage = "main" | "worldManager";

// 页面渲染函数
const renderPage = (page: ScreenPage, setPage: (page: ScreenPage) => void): ReactNode => {
	switch (page) {
		case "main":
			return <MainMenu setPage={setPage} />;
		case "worldManager":
			return <WorldManagerMenu setPage={setPage} />;
		default:
			return null;
	}
};

const StartScreen: React.FC<{ hidden: boolean }> = ({ hidden }) => {
	const ref = useDroneBackgroundMotion(!hidden);
	const [page, setPage] = useState<ScreenPage>("main");

	// 音乐控制已迁移到 Game.ts 中的 BackgroundMusicManager

	return (
		<div className="start-screen" style={hidden ? { display: "none" } : {}} ref={ref}>
			{!hidden && <DroneOverlayGrid />}
			{renderPage(page, setPage)}
			<footer className="footer">© 2025 Error.Zhang. All rights reserved.</footer>
		</div>
	);
};

export default StartScreen;
