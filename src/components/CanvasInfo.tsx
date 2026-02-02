import type { Camera } from '../types/canvas';

interface CanvasInfoProps {
	camera: Camera;
	zoom: number;
	spacePressed: boolean;
}

const CanvasInfo = ({ camera, zoom, spacePressed }: CanvasInfoProps) => {
	return (
		<div className="pointer-events-none fixed bottom-0 left-0 p-4">
			<div className="text-sm text-muted-foreground font-mono">
				Camera: ({camera.x.toFixed(0)}", {camera.y.toFixed(0)}") | Zoom:{' '}
				{zoom.toFixed(2)}x
				{spacePressed ? ' | Space: ACTIVE' : ' | Hold Space to pan'}
			</div>
		</div>
	);
};

export default CanvasInfo;
