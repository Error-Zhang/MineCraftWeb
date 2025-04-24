// src/App.tsx
import React, {useRef} from "react";
import GameCanvas from "./game-root/GameCanvas.tsx";

import GameUI from "@/ui-root/GameUI.tsx";

const App: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    return <div id="game-root">
        <GameCanvas canvasRef={canvasRef} />
       <GameUI canvasRef={canvasRef}/>
    </div>
};

export default App;
