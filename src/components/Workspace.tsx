import { useEffect, useState } from 'react';
import type { Camera, Item, Point } from '../types/canvas';
import { MIN_SCALE, MAX_SCALE } from '../types/canvas';
import { canvasToWorld, findItemAtPosition } from '../utils/coordinates';
import { drawGrid, drawItems, drawPreview } from '../utils/canvasRenderer';
import { useCanvasSetup } from '../hooks/useCanvasSetup';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import CanvasInfo from './CanvasInfo';

const Workspace = () => {
	// Canvas setup
	const { canvasRef, canvasWidth, canvasHeight } = useCanvasSetup();

	// Camera state - starts at world origin (0, 0)
	const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);

	// Panning state
	const [isPanning, setIsPanning] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	// Items state
	const [items, setItems] = useState<Item[]>([]);

	// Drawing state
	const [isDrawing, setIsDrawing] = useState(false);
	const [drawStart, setDrawStart] = useState<Point | null>(null);
	const [drawEnd, setDrawEnd] = useState<Point | null>(null);

	// Selection and dragging state
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
	const [isDraggingItem, setIsDraggingItem] = useState(false);
	const [itemDragOffset, setItemDragOffset] = useState({ x: 0, y: 0 });

	// Keyboard controls
	const { spacePressed } = useKeyboardControls({
		onResetView: () => {
			setZoom(1);
			setCamera({ x: 0, y: 0 });
		},
		setIsPanning,
	});

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

		// Draw grid
		drawGrid(ctx, camera, zoom, displayWidth, displayHeight);

		// Draw all items
		drawItems(ctx, items, selectedItemId, camera, zoom, displayWidth, displayHeight);

		// Draw preview rectangle while drawing
		if (isDrawing && drawStart && drawEnd) {
			drawPreview(ctx, drawStart, drawEnd, camera, zoom, displayWidth, displayHeight);
		}
	}, [camera, zoom, canvasWidth, canvasHeight, items, isDrawing, drawStart, drawEnd, selectedItemId]);

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
			const worldPos = canvasToWorld(
				mouseX,
				mouseY,
				camera,
				zoom,
				displayWidth,
				displayHeight
			);

			// Find topmost item at click position
			const topmostItem = findItemAtPosition(worldPos.x, worldPos.y, items);

			if (topmostItem) {
				// Start dragging the item
				setSelectedItemId(topmostItem.id);
				setIsDraggingItem(true);
				setItemDragOffset({
					x: worldPos.x - topmostItem.x,
					y: worldPos.y - topmostItem.y,
				});
			} else {
				// Deselect if clicking empty space
				setSelectedItemId(null);
				// Start drawing new rectangle
				setDrawStart(worldPos);
				setDrawEnd(worldPos);
				setIsDrawing(true);
			}
		}
	};

	const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const dpr = window.devicePixelRatio || 1;
		const displayWidth = canvas.width / dpr;
		const displayHeight = canvas.height / dpr;

		const rect = canvas.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		// Convert to world coordinates
		const worldPos = canvasToWorld(
			mouseX,
			mouseY,
			camera,
			zoom,
			displayWidth,
			displayHeight
		);

		// Handle item dragging
		if (isDraggingItem && selectedItemId) {
			setItems(
				items.map((item) =>
					item.id === selectedItemId
						? {
								...item,
								x: worldPos.x - itemDragOffset.x,
								y: worldPos.y - itemDragOffset.y,
						  }
						: item
				)
			);
			return;
		}

		// Handle panning
		if (isPanning) {
			const deltaCanvasX = e.clientX - dragOffset.x;
			const deltaCanvasY = e.clientY - dragOffset.y;

			const deltaWorldX = -deltaCanvasX / zoom;
			const deltaWorldY = -deltaCanvasY / zoom;

			setCamera({
				x: camera.x + deltaWorldX,
				y: camera.y + deltaWorldY,
			});

			setDragOffset({ x: e.clientX, y: e.clientY });
			return;
		}

		// Handle drawing preview
		if (isDrawing) {
			setDrawEnd(worldPos);
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
		<>
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
			<CanvasInfo camera={camera} zoom={zoom} spacePressed={spacePressed} />
		</>
	);
};

export default Workspace;
