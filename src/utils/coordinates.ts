import type { Camera, Point, ResizeHandle } from '../types/canvas';

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
	items: Array<{
		id: string;
		x: number;
		y: number;
		width: number;
		height: number;
	}>
): (typeof items)[number] | null => {
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

/**
 * Find which resize handle (if any) is at the given canvas coordinates
 * Returns the handle type or null if no handle is at that position
 */
export const findResizeHandleAtPosition = (
	canvasX: number,
	canvasY: number,
	item: { id: string; x: number; y: number; width: number; height: number },
	camera: Camera,
	zoom: number,
	displayWidth: number,
	displayHeight: number
): ResizeHandle | null => {
	const HANDLE_HIT_RADIUS = 10; // Hit detection radius in pixels

	// Calculate item corners in canvas coordinates
	const topLeft = worldToCanvas(
		item.x,
		item.y,
		camera,
		zoom,
		displayWidth,
		displayHeight
	);
	const itemWidth = item.width * zoom;
	const itemHeight = item.height * zoom;

	// Define the 4 corner positions with their handle types
	const handles: Array<{ x: number; y: number; type: ResizeHandle }> = [
		{ x: topLeft.x, y: topLeft.y, type: 'nw' },
		{ x: topLeft.x + itemWidth, y: topLeft.y, type: 'ne' },
		{ x: topLeft.x, y: topLeft.y + itemHeight, type: 'sw' },
		{ x: topLeft.x + itemWidth, y: topLeft.y + itemHeight, type: 'se' },
	];

	// Check each handle (check in order so first match wins)
	for (const handle of handles) {
		const dx = canvasX - handle.x;
		const dy = canvasY - handle.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance <= HANDLE_HIT_RADIUS) {
			return handle.type;
		}
	}

	return null;
};
