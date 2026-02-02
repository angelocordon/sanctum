import { useEffect, useState } from 'react';
import type { Camera, Item, Point, ResizeHandle } from '../types/canvas';
import { MIN_SCALE, MAX_SCALE } from '../types/canvas';
import {
	canvasToWorld,
	findItemAtPosition,
	findResizeHandleAtPosition,
} from '../utils/coordinates';
import {
	drawGrid,
	drawItems,
	drawPreview,
	drawResizeHandles,
} from '../utils/canvasRenderer';
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

	// Resize state
	const [isResizing, setIsResizing] = useState(false);
	const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
	const [resizeStartDimensions, setResizeStartDimensions] = useState<{
		width: number;
		height: number;
		x: number;
		y: number;
	} | null>(null);
	const [resizeStartMouse, setResizeStartMouse] = useState<Point | null>(null);

	// Hover state for cursor feedback
	const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle | null>(null);

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
		drawItems(
			ctx,
			items,
			selectedItemId,
			camera,
			zoom,
			displayWidth,
			displayHeight
		);

		// Draw resize handles for selected item
		if (selectedItemId) {
			const selectedItem = items.find((item) => item.id === selectedItemId);
			if (selectedItem) {
				drawResizeHandles(
					ctx,
					selectedItem,
					camera,
					zoom,
					displayWidth,
					displayHeight
				);
			}
		}

		// Draw preview rectangle while drawing
		if (isDrawing && drawStart && drawEnd) {
			drawPreview(
				ctx,
				drawStart,
				drawEnd,
				camera,
				zoom,
				displayWidth,
				displayHeight
			);
		}
	}, [
		camera,
		zoom,
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
			const worldPos = canvasToWorld(
				mouseX,
				mouseY,
				camera,
				zoom,
				displayWidth,
				displayHeight
			);

			// Check if clicking on a resize handle of the selected item FIRST
			// This must happen before findItemAtPosition to prevent edge case issues
			if (selectedItemId) {
				const selectedItem = items.find((item) => item.id === selectedItemId);
				if (selectedItem) {
					const handle = findResizeHandleAtPosition(
						mouseX,
						mouseY,
						selectedItem,
						camera,
						zoom,
						displayWidth,
						displayHeight
					);

					if (handle) {
						// Start resizing
						setIsResizing(true);
						setActiveHandle(handle);
						setResizeStartDimensions({
							width: selectedItem.width,
							height: selectedItem.height,
							x: selectedItem.x,
							y: selectedItem.y,
						});
						setResizeStartMouse(worldPos);
						return;
					}
				}
			}

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

		// Handle resizing
		if (
			isResizing &&
			selectedItemId &&
			activeHandle &&
			resizeStartDimensions &&
			resizeStartMouse
		) {
			const MIN_SIZE = 6; // Minimum size in inches
			const deltaX = worldPos.x - resizeStartMouse.x;
			const deltaY = worldPos.y - resizeStartMouse.y;

			setItems(
				items.map((item) => {
					if (item.id !== selectedItemId) return item;

					let newWidth = resizeStartDimensions.width;
					let newHeight = resizeStartDimensions.height;
					let newX = resizeStartDimensions.x;
					let newY = resizeStartDimensions.y;

					// Calculate new dimensions based on which handle is being dragged
					switch (activeHandle) {
						case 'nw':
							// Northwest: adjust x, y, width, height
							newWidth = resizeStartDimensions.width - deltaX;
							newHeight = resizeStartDimensions.height - deltaY;
							if (newWidth >= MIN_SIZE) {
								newX = resizeStartDimensions.x + deltaX;
							} else {
								newWidth = MIN_SIZE;
								newX =
									resizeStartDimensions.x +
									resizeStartDimensions.width -
									MIN_SIZE;
							}
							if (newHeight >= MIN_SIZE) {
								newY = resizeStartDimensions.y + deltaY;
							} else {
								newHeight = MIN_SIZE;
								newY =
									resizeStartDimensions.y +
									resizeStartDimensions.height -
									MIN_SIZE;
							}
							break;

						case 'ne':
							// Northeast: adjust y, width, height
							newWidth = resizeStartDimensions.width + deltaX;
							newHeight = resizeStartDimensions.height - deltaY;
							newWidth = Math.max(MIN_SIZE, newWidth);
							if (newHeight >= MIN_SIZE) {
								newY = resizeStartDimensions.y + deltaY;
							} else {
								newHeight = MIN_SIZE;
								newY =
									resizeStartDimensions.y +
									resizeStartDimensions.height -
									MIN_SIZE;
							}
							break;

						case 'sw':
							// Southwest: adjust x, width, height
							newWidth = resizeStartDimensions.width - deltaX;
							newHeight = resizeStartDimensions.height + deltaY;
							if (newWidth >= MIN_SIZE) {
								newX = resizeStartDimensions.x + deltaX;
							} else {
								newWidth = MIN_SIZE;
								newX =
									resizeStartDimensions.x +
									resizeStartDimensions.width -
									MIN_SIZE;
							}
							newHeight = Math.max(MIN_SIZE, newHeight);
							break;

						case 'se':
							// Southeast: adjust width, height
							newWidth = resizeStartDimensions.width + deltaX;
							newHeight = resizeStartDimensions.height + deltaY;
							newWidth = Math.max(MIN_SIZE, newWidth);
							newHeight = Math.max(MIN_SIZE, newHeight);
							break;
					}

					return {
						...item,
						x: newX,
						y: newY,
						width: newWidth,
						height: newHeight,
					};
				})
			);
			return;
		}

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
			return;
		}

		// Update hovered handle for cursor feedback (when not performing other actions)
		if (!isResizing && !isDraggingItem && !isPanning && selectedItemId) {
			const selectedItem = items.find((item) => item.id === selectedItemId);
			if (selectedItem) {
				const handle = findResizeHandleAtPosition(
					mouseX,
					mouseY,
					selectedItem,
					camera,
					zoom,
					displayWidth,
					displayHeight
				);
				setHoveredHandle(handle);
			} else {
				setHoveredHandle(null);
			}
		} else {
			setHoveredHandle(null);
		}
	};

	const handleCanvasMouseUp = () => {
		// End resizing (keep selection active)
		if (isResizing) {
			setIsResizing(false);
			setActiveHandle(null);
			setResizeStartDimensions(null);
			setResizeStartMouse(null);
			return;
		}

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

	// Get cursor style based on current state
	const getCursorStyle = (): string => {
		if (isResizing) return 'cursor-grabbing';
		if (isDraggingItem) return 'cursor-grabbing';
		if (isPanning) return 'cursor-grabbing';
		if (spacePressed) return 'cursor-grab';

		// Show resize cursors when hovering over handles
		if (hoveredHandle) {
			if (hoveredHandle === 'nw' || hoveredHandle === 'se')
				return 'cursor-nwse-resize';
			if (hoveredHandle === 'ne' || hoveredHandle === 'sw')
				return 'cursor-nesw-resize';
		}

		return 'cursor-crosshair';
	};

	return (
		<>
			<canvas
				ref={canvasRef}
				className={`fixed inset-0 bg-card ${getCursorStyle()}`}
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
