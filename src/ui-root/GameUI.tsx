import React, {
	createContext,
	RefObject,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { generateAllBlockIcons } from "@/block-icon/generator.ts";
import GameWindow from "@/game-root/events/GameWindow.ts";
import { BlockIconStore } from "@/block-icon/store.ts";
import blockFactory from "@/blocks/core/BlockFactory.ts";

import GameUIWrapper from "./components/GameUIWrapper.tsx";
import HotBar from "./views/hotbar";
import Catalog from "./views/catalog";
import { HandSlotManager } from "@/ui-root/components/slot/HandSlotManager.tsx";
import Bag from "@/ui-root/views/bag";

export interface GameProps {
	game: GameWindow;
	blockIconMap: Record<string, string>;
	gameMode: string;
}

export const GameContext = createContext<GameProps>({} as GameProps);

const GameUI: React.FC<{ canvasRef: RefObject<HTMLCanvasElement> }> = ({ canvasRef }) => {
	const [isRender, setIsRender] = useState(false);
	const blockIconMap = useRef<Record<string, string>>();
	const game = useRef<GameWindow>();
	const gameMode = useRef<string>("creative");

	useLayoutEffect(() => {
		game.current = GameWindow.getInstance(canvasRef.current!);
		return () => {
			game.current?.destroy();
		};
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
