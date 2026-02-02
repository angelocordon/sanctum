// Grid spacing constant in inches
export const GRID_SPACING = 12;

// Zoom limits
export const MIN_SCALE = 0.01;
export const MAX_SCALE = 10;

// Camera position in world space (inches)
export interface Camera {
	x: number;
	y: number;
}

// Item represents a rectangle in the room layout
export interface Item {
	id: string;
	x: number; // position in world space (inches)
	y: number; // position in world space (inches)
	width: number; // width in inches
	height: number; // height in inches
	rotation: number; // rotation angle in degrees (0-360)
	label?: string; // optional item label
}

// Point in 2D space
export interface Point {
	x: number;
	y: number;
}
