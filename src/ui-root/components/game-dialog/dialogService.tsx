// ConfirmService.ts
import { createRoot } from "react-dom/client";
import GameDialog from "./index.tsx";

let container: HTMLDivElement | null = null;

export interface ConfirmOptions {
	title: string;
	message?: string;
	onConfirm?: () => void;
	onCancel?: () => void;
}

export const openGameDialog = (options: ConfirmOptions) => {
	if (!container) {
		container = document.createElement("div");
		document.body.appendChild(container);
	}

	const root = createRoot(container);
	const handleCancel = () => {
		root.unmount();
		container && container.remove();
		container = null;
		options.onCancel?.();
	};

	const handleConfirm = () => {
		root.unmount();
		container && container.remove();
		container = null;
		options.onConfirm?.();
	};

	root.render(
		<GameDialog
			show={true}
			title={options.title}
			message={options.message}
			onConfirm={handleConfirm}
			onCancel={handleCancel}
		/>
	);
};
