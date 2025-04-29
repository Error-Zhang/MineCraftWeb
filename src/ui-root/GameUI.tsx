import React, {
	createContext,
	RefObject,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { generateAllBlockIcons } from "@/block-icon/generator.ts";
import GameListener from "@/game-root/events/GameListener.ts";
import GameStore, { GameMode } from "@/game-root/events/GameStore.ts";
import { BlockIconStore } from "@/block-icon/store.ts";
import blockFactory from "@/blocks/core/BlockFactory.ts";

import GameUIWrapper from "./components/GameUIWrapper.tsx";
import HotBar from "./views/hotbar";
import Catalog from "./views/catalog";
import { HandSlotManager } from "@/ui-root/components/slot/HandSlotManager.tsx";
import Bag from "@/ui-root/views/bag";

export interface GameProps {
	game: GameListener;
	blockIconMap: Record<string, string>;
	gameMode: GameMode;
}

export const GameContext = createContext<GameProps>({} as GameProps);

const GameUI: React.FC<{ canvasRef: RefObject<HTMLCanvasElement> }> = ({ canvasRef }) => {
	const [isRender, setIsRender] = useState(false);
	const blockIconMap = useRef<Record<string, string>>();
	const game = useRef<GameListener>();
	const gameMode = useRef<GameMode>();

	useLayoutEffect(() => {
		const callback = () => (gameMode.current = GameStore.get("gameMode")!);
		GameStore.on("gameMode", callback);
		game.current = new GameListener(canvasRef.current!);

		return () => {
			GameStore.off("gameMode", callback);
			game.current?.destroy();
		};
	}, []);

	useEffect(() => {
		GameStore.set("gameMode", "creative");
	}, []);

	useEffect(() => {
		generateAllBlockIcons().then(_ => {
			const registerBlocks = blockFactory.getAllRegisterBlocks();
			BlockIconStore.getIconUrls(registerBlocks).then(record => {
				blockIconMap.current = record;
				setIsRender(true);
			});
		});
	}, []);

	return (
		isRender && (
			<GameUIWrapper canvasRef={canvasRef}>
				<GameContext.Provider
					value={{
						game: game.current!,
						blockIconMap: blockIconMap.current!,
						gameMode: gameMode.current!,
					}}
				>
					<HotBar />
					<Catalog />
					<Bag rows={4} columns={6} />
				</GameContext.Provider>
				<HandSlotManager />
			</GameUIWrapper>
		)
	);
};

export default GameUI;
