import type { Camera, Point } from '../types/canvas';

/**
 * Convert world coordinates (inches) to canvas pixel coordinates
 */
export const worldToCanvas = (
	worldX: number,
	worldY: number,
	camera: Camera,
	zoom: number,
	displayWidth: number,
	displayHeight: number
): Point => {
	// World origin is at center of canvas
	// Camera position determines what part of the world is visible
	const viewX = worldX - camera.x;
	const viewY = worldY - camera.y;

	// Convert to canvas space (canvas center corresponds to camera position)
	const canvasX = displayWidth / 2 + viewX * zoom;
	const canvasY = displayHeight / 2 + viewY * zoom;

	return { x: canvasX, y: canvasY };
};

/**
 * Convert canvas pixel coordinates to world coordinates (inches)
 */
export const canvasToWorld = (
	canvasX: number,
	canvasY: number,
	camera: Camera,
	zoom: number,
	displayWidth: number,
	displayHeight: number
): Point => {
	const viewX = (canvasX - displayWidth / 2) / zoom;
	const viewY = (canvasY - displayHeight / 2) / zoom;
	const worldX = viewX + camera.x;
	const worldY = viewY + camera.y;

	return { x: worldX, y: worldY };
};

/**
 * Find the topmost item at the given world coordinates
 */
export const findItemAtPosition = (
	worldX: number,
	worldY: number,
	items: Array<{ id: string; x: number; y: number; width: number; height: number }>
): typeof items[number] | null => {
	// Iterate in reverse order to check topmost items first
	for (let i = items.length - 1; i >= 0; i--) {
		const item = items[i];
		if (
			worldX >= item.x &&
			worldX <= item.x + item.width &&
			worldY >= item.y &&
			worldY <= item.y + item.height
		) {
			return item;
		}
	}
	return null;
};
