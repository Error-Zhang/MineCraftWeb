import React, { ReactNode, useState } from "react";
import "./index.less";
import { useDroneBackgroundMotion } from "@/ui-root/hooks/useDroneBackgroundMotion.tsx";
import DroneOverlayGrid from "./components/DroneOverlayGrid.tsx";
import MainMenu from "./components/MainMenu.tsx";
import WorldManagerMenu from "./components/world-manager-menu";

export type ScreenPage = "main" | "worldManager";

// 页面渲染函数，传递 setPage 给组件
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

const StartScreen: React.FC = () => {
	const ref = useDroneBackgroundMotion();
	const [page, setPage] = useState<ScreenPage>("main");

	return (
		<div className="start-screen" ref={ref}>
			<DroneOverlayGrid />
			{renderPage(page, setPage)}
			<footer className="footer">© 2025 Error.Zhang. All rights reserved.</footer>
		</div>
	);
};

export default StartScreen;
