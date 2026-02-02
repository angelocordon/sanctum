import { useEffect, useRef, useState } from 'react';

/**
 * Hook to manage canvas setup and sizing with devicePixelRatio support
 */
export const useCanvasSetup = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [canvasWidth, setCanvasWidth] = useState(0);
	const [canvasHeight, setCanvasHeight] = useState(0);

	useEffect(() => {
		const updateCanvasSize = () => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const dpr = window.devicePixelRatio || 1;
			const width = window.innerWidth;
			const height = window.innerHeight;

			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;

			// Set actual size in memory (scaled for device pixel ratio)
			canvas.width = width * dpr;
			canvas.height = height * dpr;

			// Update state to trigger re-render
			setCanvasWidth(canvas.width);
			setCanvasHeight(canvas.height);
		};

		updateCanvasSize();

		window.addEventListener('resize', updateCanvasSize);

		return () => {
			window.removeEventListener('resize', updateCanvasSize);
		};
	}, []);

	return {
		canvasRef,
		canvasWidth,
		canvasHeight,
	};
};
