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
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const musicListRef = useRef<string[]>([]);
	const currentIndexRef = useRef(0);

	useEffect(() => {
		let needsUserInteraction = false;

		const loadMusic = async () => {
			const modules = import.meta.glob("/src/ui-root/assets/musics/*.mp3", {
				eager: true,
			}) as Record<string, { default: string }>;
			const sorted = Object.entries(modules)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([_, mod]) => mod.default);
			musicListRef.current = sorted;
			try {
				await playMusic(0);
			} catch (err) {
				console.warn("自动播放失败，等待用户交互");
				needsUserInteraction = true;
			}
		};

		const stop = () => {
			// 如果已有 audio，先停止释放
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current.src = "";
				audioRef.current = null;
			}
		};

		const playMusic = async (index: number) => {
			const list = musicListRef.current;
			if (!list.length) return;

			const audio = new Audio(list[index]);
			audioRef.current = audio;

			audio.addEventListener("ended", () => {
				const nextIndex = (index + 1) % list.length;
				currentIndexRef.current = nextIndex;
				playMusic(nextIndex);
			});

			audio.volume = 0.5;
			await audio.play();
		};

		const handleUserInteraction = () => {
			if (needsUserInteraction && musicListRef.current.length > 0) {
				needsUserInteraction = false;
				playMusic(currentIndexRef.current);
				window.removeEventListener("pointerdown", handleUserInteraction);
			}
		};

		loadMusic();
		window.addEventListener("pointerdown", handleUserInteraction);

		useGameStore.subscribe(state => {
			if (state.isGaming) {
				stop();
			}
		});

		return () => {
			// 清理事件监听
			window.removeEventListener("pointerdown", handleUserInteraction);
		};
	}, []);

	return (
		<div className="start-screen" style={hidden ? { display: "none" } : {}} ref={ref}>
			{!hidden && <DroneOverlayGrid />}
			{renderPage(page, setPage)}
			<footer className="footer">© 2025 Error.Zhang. All rights reserved.</footer>
		</div>
	);
};

export default StartScreen;
