import { useEffect, useRef, useState } from 'react'

// Grid spacing constant in inches
const GRID_SPACING = 12;

// Zoom limits
const MIN_SCALE = 0.01;
const MAX_SCALE = 10; 

// camera position in world space (inches)
interface Camera {
	x: number;
	y: number;
}

// Item represents a rectangle in the room layout
interface Item {
	id: string;
	x: number; // position in world space (inches)
	y: number; // position in world space (inches)
	width: number; // width in inches
	height: number; // height in inches
	rotation: number; // rotation angle in degrees (0-360)
	label?: string; // optional item label
}

const Workspace = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isPanning, setIsPanning] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const [spacePressed, setSpacePressed] = useState(false);

	// Camera state - starts at world origin (0, 0)
	const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });

	// Zoom state - 1.0 is base scale (1 pixel per inch)
	const [zoom, setZoom] = useState(1);

	// Canvas dimensions - dynamically updated on resize
	const [canvasWidth, setCanvasWidth] = useState(0);
	const [canvasHeight, setCanvasHeight] = useState(0);

	// Items state
	const [items, setItems] = useState<Item[]>([]);

	// Drawing state
	const [isDrawing, setIsDrawing] = useState(false);
	const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
		null
	);
	const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null);

	// Selection and dragging state
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
	const [isDraggingItem, setIsDraggingItem] = useState(false);
	const [itemDragOffset, setItemDragOffset] = useState({ x: 0, y: 0 });

	// Handle space key for panning and keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.code === 'Space' && !e.repeat) {
				setSpacePressed(true);
				e.preventDefault();
			}

			// Cmd/Ctrl+0 to reset zoom and camera
			if ((e.metaKey || e.ctrlKey) && e.key === '0') {
				setZoom(1);
				setCamera({ x: 0, y: 0 });
				e.preventDefault();
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.code === 'Space') {
				setSpacePressed(false);
				setIsPanning(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, []);

	// Keep the canvas buffer in sync with the viewport and devicePixelRatio so
	// drawing stays crisp and coordinates remain correct (CSS size alone
	// stretches the default 300x150 buffer and causes blur/misalignment).
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

	// Main rendering effect
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		if (canvasWidth === 0 || canvasHeight === 0) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Reset transform and scale the context for devicePixelRatio
		const dpr = window.devicePixelRatio || 1;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.scale(dpr, dpr);

		// Clear the canvas (use CSS pixel dimensions for clearing)
		const displayWidth = canvas.width / dpr;
		const displayHeight = canvas.height / dpr;
		ctx.clearRect(0, 0, displayWidth, displayHeight);

		// Scale (pixels per inch) based on zoom level
		const scale = zoom;

		// Helper function to convert world coordinates to canvas coordinates
		const worldToCanvas = (worldX: number, worldY: number) => {
			// World origin is at center of canvas
			// Camera position determines what part of the world is visible
			const viewX = worldX - camera.x;
			const viewY = worldY - camera.y;

			// Convert to canvas space (canvas center corresponds to camera position)
			const canvasX = displayWidth / 2 + viewX * scale;
			const canvasY = displayHeight / 2 + viewY * scale;

			return { x: canvasX, y: canvasY };
		};

		// Calculate visible world bounds based on camera position
		const visibleWorldWidth = displayWidth / scale;
		const visibleWorldHeight = displayHeight / scale;

		const visibleMinX = camera.x - visibleWorldWidth / 2;
		const visibleMaxX = camera.x + visibleWorldWidth / 2;
		const visibleMinY = camera.y - visibleWorldHeight / 2;
		const visibleMaxY = camera.y + visibleWorldHeight / 2;

		// Draw infinite grid
		ctx.strokeStyle = '#444';
		ctx.lineWidth = 0.5;

		// Calculate grid line range based on visible area
		const startX = Math.floor(visibleMinX / GRID_SPACING) * GRID_SPACING;
		const endX = Math.ceil(visibleMaxX / GRID_SPACING) * GRID_SPACING;
		const startY = Math.floor(visibleMinY / GRID_SPACING) * GRID_SPACING;
		const endY = Math.ceil(visibleMaxY / GRID_SPACING) * GRID_SPACING;

		// Vertical grid lines
		for (let x = startX; x <= endX; x += GRID_SPACING) {
			const start = worldToCanvas(x, visibleMinY);
			const end = worldToCanvas(x, visibleMaxY);
			ctx.beginPath();
			ctx.moveTo(start.x, start.y);
			ctx.lineTo(end.x, end.y);
			ctx.stroke();
		}

		// Horizontal grid lines
		for (let y = startY; y <= endY; y += GRID_SPACING) {
			const start = worldToCanvas(visibleMinX, y);
			const end = worldToCanvas(visibleMaxX, y);
			ctx.beginPath();
			ctx.moveTo(start.x, start.y);
			ctx.lineTo(end.x, end.y);
			ctx.stroke();
		}

		// Draw all items
		items.forEach((item) => {
			const topLeft = worldToCanvas(item.x, item.y);
			const itemWidth = item.width * scale;
			const itemHeight = item.height * scale;
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

			const dimensionText = `${item.width.toFixed(0)}″ × ${item.height.toFixed(
				0
			)}″`;
			ctx.font = 'bold 14px system-ui, sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';

			// Text with stroke for visibility
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 3;
			ctx.strokeText(dimensionText, centerX, centerY);

			ctx.fillStyle = '#fff';
			ctx.fillText(dimensionText, centerX, centerY);
		});

		// Draw preview rectangle while drawing
		if (isDrawing && drawStart && drawEnd) {
			const minX = Math.min(drawStart.x, drawEnd.x);
			const minY = Math.min(drawStart.y, drawEnd.y);
			const width = Math.abs(drawEnd.x - drawStart.x);
			const height = Math.abs(drawEnd.y - drawStart.y);

			const topLeft = worldToCanvas(minX, minY);
			const previewWidth = width * scale;
			const previewHeight = height * scale;

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
			ctx.font = 'bold 14px system-ui, sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';

			ctx.strokeStyle = '#000';
			ctx.lineWidth = 3;
			ctx.strokeText(dimensionText, centerX, centerY);

			ctx.fillStyle = '#fff';
			ctx.fillText(dimensionText, centerX, centerY);
		}

		// Display camera info
		ctx.fillStyle = '#888';
		ctx.font = '12px system-ui, sans-serif';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'alphabetic';
		ctx.fillText(
			`Camera: (${camera.x.toFixed(0)}", ${camera.y.toFixed(
				0
			)}") | Zoom: ${zoom.toFixed(2)}x${
				spacePressed ? ' | Space: ACTIVE' : ' | Hold Space to pan'
			}`,
			10,
			displayHeight - 10
		);
	}, [
		camera,
		zoom,
		spacePressed,
		canvasWidth,
		canvasHeight,
		items,
		isDrawing,
		drawStart,
		drawEnd,
		selectedItemId,
	]);

	const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
		// Start panning on middle-click or when space is pressed
		if (e.button === 1 || spacePressed) {
			setIsPanning(true);
			setDragOffset({ x: e.clientX, y: e.clientY });
			e.preventDefault();
			return;
		}

		// Handle left-click when not panning
		if (e.button === 0 && !isPanning && !spacePressed) {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const dpr = window.devicePixelRatio || 1;
			const displayWidth = canvas.width / dpr;
			const displayHeight = canvas.height / dpr;

			const rect = canvas.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;

			// Convert to world coordinates
			const viewX = (mouseX - displayWidth / 2) / zoom;
			const viewY = (mouseY - displayHeight / 2) / zoom;
			const worldX = viewX + camera.x;
			const worldY = viewY + camera.y;

			// Find topmost item at click position (iterate in reverse)
			let topmostItem: Item | null = null;
			for (let i = items.length - 1; i >= 0; i--) {
				const item = items[i];
				if (
					worldX >= item.x &&
					worldX <= item.x + item.width &&
					worldY >= item.y &&
					worldY <= item.y + item.height
				) {
					topmostItem = item;
					break;
				}
			}

			if (topmostItem) {
				// Start dragging the item
				setSelectedItemId(topmostItem.id);
				setIsDraggingItem(true);
				// Store offset from item origin to click point
				setItemDragOffset({
					x: worldX - topmostItem.x,
					y: worldY - topmostItem.y,
				});
			} else {
				// Deselect if clicking empty space
				setSelectedItemId(null);
				// Start drawing new rectangle
				setDrawStart({ x: worldX, y: worldY });
				setDrawEnd({ x: worldX, y: worldY });
				setIsDrawing(true);
			}
		}
	};

	const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		// Handle item dragging
		if (isDraggingItem && selectedItemId) {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const dpr = window.devicePixelRatio || 1;
			const displayWidth = canvas.width / dpr;
			const displayHeight = canvas.height / dpr;

			const rect = canvas.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;

			// Convert to world coordinates
			const viewX = (mouseX - displayWidth / 2) / zoom;
			const viewY = (mouseY - displayHeight / 2) / zoom;
			const worldX = viewX + camera.x;
			const worldY = viewY + camera.y;

			// Update item position (accounting for drag offset)
			setItems(
				items.map((item) =>
					item.id === selectedItemId
						? {
								...item,
								x: worldX - itemDragOffset.x,
								y: worldY - itemDragOffset.y,
						  }
						: item
				)
			);
			return;
		}

		// Handle panning
		if (isPanning) {
			// Calculate movement delta in canvas pixels
			const deltaCanvasX = e.clientX - dragOffset.x;
			const deltaCanvasY = e.clientY - dragOffset.y;

			// Convert canvas delta to world delta (inverted for natural panning feel)
			const deltaWorldX = -deltaCanvasX / zoom;
			const deltaWorldY = -deltaCanvasY / zoom;

			// Update camera position (no clamping - infinite canvas)
			setCamera({
				x: camera.x + deltaWorldX,
				y: camera.y + deltaWorldY,
			});

			setDragOffset({ x: e.clientX, y: e.clientY });
			return;
		}

		// Handle drawing preview
		if (isDrawing) {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const dpr = window.devicePixelRatio || 1;
			const displayWidth = canvas.width / dpr;
			const displayHeight = canvas.height / dpr;

			const rect = canvas.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;

			// Convert to world coordinates
			const viewX = (mouseX - displayWidth / 2) / zoom;
			const viewY = (mouseY - displayHeight / 2) / zoom;
			const worldX = viewX + camera.x;
			const worldY = viewY + camera.y;

			setDrawEnd({ x: worldX, y: worldY });
		}
	};

	const handleCanvasMouseUp = () => {
		// End item dragging (keep selection active)
		if (isDraggingItem) {
			setIsDraggingItem(false);
			return;
		}

		// End panning
		if (isPanning) {
			setIsPanning(false);
		}

		// Complete rectangle drawing
		if (isDrawing && drawStart && drawEnd) {
			const width = Math.abs(drawEnd.x - drawStart.x);
			const height = Math.abs(drawEnd.y - drawStart.y);

			// Only create item if dimensions meet minimum size (6 inches)
			if (width >= 6 && height >= 6) {
				const minX = Math.min(drawStart.x, drawEnd.x);
				const minY = Math.min(drawStart.y, drawEnd.y);

				const newItem: Item = {
					id: crypto.randomUUID(),
					x: minX,
					y: minY,
					width,
					height,
					rotation: 0,
				};

				setItems([...items, newItem]);
			}

			// Reset drawing state
			setIsDrawing(false);
			setDrawStart(null);
			setDrawEnd(null);
		}
	};

	const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
		e.preventDefault();

		const canvas = canvasRef.current;
		if (!canvas) return;

		const dpr = window.devicePixelRatio || 1;
		const displayWidth = canvas.width / dpr;
		const displayHeight = canvas.height / dpr;

		// Mouse position in canvas coordinates
		const rect = canvas.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		// Get world point under cursor BEFORE zoom
		const viewX = (mouseX - displayWidth / 2) / zoom;
		const viewY = (mouseY - displayHeight / 2) / zoom;
		const worldX = viewX + camera.x;
		const worldY = viewY + camera.y;

		// Calculate new zoom level
		const zoomFactor = Math.exp(-e.deltaY * 0.002);
		const newZoom = Math.max(MIN_SCALE, Math.min(MAX_SCALE, zoom * zoomFactor));

		// Adjust camera so world point stays under cursor
		const newCamera = {
			x: worldX - (mouseX - displayWidth / 2) / newZoom,
			y: worldY - (mouseY - displayHeight / 2) / newZoom,
		};

		setZoom(newZoom);
		setCamera(newCamera);
	};

	return (
		<canvas
			ref={canvasRef}
			className={`fixed inset-0 bg-card ${
				isDraggingItem
					? 'cursor-grabbing'
					: isPanning
					? 'cursor-grabbing'
					: spacePressed
					? 'cursor-grab'
					: 'cursor-crosshair'
			}`}
			onMouseDown={handleCanvasMouseDown}
			onMouseMove={handleCanvasMouseMove}
			onMouseUp={handleCanvasMouseUp}
			onMouseLeave={handleCanvasMouseUp}
			onWheel={handleWheel}
		/>
	);
}

export default Workspace
