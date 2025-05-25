import React, { ReactNode } from "react";
import "./index.less";
import buttonClickSound from "@/ui-root/assets/sounds/ButtonClick.flac";

interface GameButtonProps {
	children?: ReactNode;
	onClick?: () => void;
	className?: string;
	disabled?: boolean;
}

const audio = new Audio(buttonClickSound);
const GameButton: React.FC<GameButtonProps> = ({ children, onClick, className, disabled }) => {
	return (
		<button
			disabled={disabled}
			className={`game-button ${className}`}
			onClick={() => {
				audio.play();
				onClick?.();
			}}
		>
			{children}
		</button>
	);
};

export default GameButton;
