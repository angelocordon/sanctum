import type { Camera, Item, Point } from '../types/canvas';
import { GRID_SPACING } from '../types/canvas';
import { worldToCanvas } from './coordinates';

/**
 * Draw an infinite grid on the canvas
 */
export const drawGrid = (
	ctx: CanvasRenderingContext2D,
	camera: Camera,
	zoom: number,
	displayWidth: number,
	displayHeight: number
): void => {
	// Calculate visible world bounds
	const visibleWorldWidth = displayWidth / zoom;
	const visibleWorldHeight = displayHeight / zoom;

	const visibleMinX = camera.x - visibleWorldWidth / 2;
	const visibleMaxX = camera.x + visibleWorldWidth / 2;
	const visibleMinY = camera.y - visibleWorldHeight / 2;
	const visibleMaxY = camera.y + visibleWorldHeight / 2;

	ctx.strokeStyle = '#444';
	ctx.lineWidth = 0.5;

	// Calculate grid line range based on visible area
	const startX = Math.floor(visibleMinX / GRID_SPACING) * GRID_SPACING;
	const endX = Math.ceil(visibleMaxX / GRID_SPACING) * GRID_SPACING;
	const startY = Math.floor(visibleMinY / GRID_SPACING) * GRID_SPACING;
	const endY = Math.ceil(visibleMaxY / GRID_SPACING) * GRID_SPACING;

	// Vertical grid lines
	for (let x = startX; x <= endX; x += GRID_SPACING) {
		const start = worldToCanvas(x, visibleMinY, camera, zoom, displayWidth, displayHeight);
		const end = worldToCanvas(x, visibleMaxY, camera, zoom, displayWidth, displayHeight);
		ctx.beginPath();
		ctx.moveTo(start.x, start.y);
		ctx.lineTo(end.x, end.y);
		ctx.stroke();
	}

	// Horizontal grid lines
	for (let y = startY; y <= endY; y += GRID_SPACING) {
		const start = worldToCanvas(visibleMinX, y, camera, zoom, displayWidth, displayHeight);
		const end = worldToCanvas(visibleMaxX, y, camera, zoom, displayWidth, displayHeight);
		ctx.beginPath();
		ctx.moveTo(start.x, start.y);
		ctx.lineTo(end.x, end.y);
		ctx.stroke();
	}
};

/**
 * Draw dimension label with stroke outline for visibility
 */
const drawDimensionLabel = (
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number
): void => {
	ctx.font = 'bold 14px system-ui, sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	// Text with stroke for visibility
	ctx.strokeStyle = '#000';
	ctx.lineWidth = 3;
	ctx.strokeText(text, x, y);

	ctx.fillStyle = '#fff';
	ctx.fillText(text, x, y);
};

/**
 * Draw all items on the canvas
 */
export const drawItems = (
	ctx: CanvasRenderingContext2D,
	items: Item[],
	selectedItemId: string | null,
	camera: Camera,
	zoom: number,
	displayWidth: number,
	displayHeight: number
): void => {
	items.forEach((item) => {
		const topLeft = worldToCanvas(item.x, item.y, camera, zoom, displayWidth, displayHeight);
		const itemWidth = item.width * zoom;
		const itemHeight = item.height * zoom;
		const isSelected = item.id === selectedItemId;

		// Draw rectangle with semi-transparent fill and solid border
		ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
		ctx.fillRect(topLeft.x, topLeft.y, itemWidth, itemHeight);

		// Highlight selected items with orange border
		ctx.strokeStyle = isSelected ? '#ff9500' : '#4a90e2';
		ctx.lineWidth = isSelected ? 3 : 2;
		ctx.strokeRect(topLeft.x, topLeft.y, itemWidth, itemHeight);

		// Draw centered dimension label
		const centerX = topLeft.x + itemWidth / 2;
		const centerY = topLeft.y + itemHeight / 2;
		const dimensionText = `${item.width.toFixed(0)}″ × ${item.height.toFixed(0)}″`;
		drawDimensionLabel(ctx, dimensionText, centerX, centerY);
	});
};

/**
 * Draw preview rectangle while drawing
 */
export const drawPreview = (
	ctx: CanvasRenderingContext2D,
	start: Point,
	end: Point,
	camera: Camera,
	zoom: number,
	displayWidth: number,
	displayHeight: number
): void => {
	const minX = Math.min(start.x, end.x);
	const minY = Math.min(start.y, end.y);
	const width = Math.abs(end.x - start.x);
	const height = Math.abs(end.y - start.y);

	const topLeft = worldToCanvas(minX, minY, camera, zoom, displayWidth, displayHeight);
	const previewWidth = width * zoom;
	const previewHeight = height * zoom;

	// Draw preview with slightly different styling
	ctx.fillStyle = 'rgba(100, 150, 255, 0.2)';
	ctx.fillRect(topLeft.x, topLeft.y, previewWidth, previewHeight);

	ctx.strokeStyle = '#4a90e2';
	ctx.lineWidth = 2;
	ctx.setLineDash([5, 5]);
	ctx.strokeRect(topLeft.x, topLeft.y, previewWidth, previewHeight);
	ctx.setLineDash([]);

	// Draw dimension label for preview
	const centerX = topLeft.x + previewWidth / 2;
	const centerY = topLeft.y + previewHeight / 2;
	const dimensionText = `${width.toFixed(0)}″ × ${height.toFixed(0)}″`;
	drawDimensionLabel(ctx, dimensionText, centerX, centerY);
};
