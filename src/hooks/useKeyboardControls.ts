import { useEffect, useState } from 'react';

interface UseKeyboardControlsOptions {
	onResetView: () => void;
	setIsPanning?: (isPanning: boolean) => void;
}

/**
 * Hook to manage keyboard controls for panning and shortcuts
 */
export const useKeyboardControls = ({
	onResetView,
	setIsPanning,
}: UseKeyboardControlsOptions) => {
	const [spacePressed, setSpacePressed] = useState(false);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.code === 'Space' && !e.repeat) {
				setSpacePressed(true);
				e.preventDefault();
			}

			// Cmd/Ctrl+0 to reset zoom and camera
			if ((e.metaKey || e.ctrlKey) && e.key === '0') {
				onResetView();
				e.preventDefault();
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.code === 'Space') {
				setSpacePressed(false);
				// Stop panning when space is released
				if (setIsPanning) {
					setIsPanning(false);
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [onResetView, setIsPanning]);

	return { spacePressed };
};
