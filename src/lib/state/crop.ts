import type { CropState } from '../types';

// Minimum zoom fraction — prevents zooming in to single-pixel territory
const MIN_ZOOM_FRACTION = 0.01;

export const DEFAULT_CROP: CropState = {
	offsetX: 0,
	offsetY: 0,
	zoomFraction: 1.0,
};

/**
 * Compute the initial zoomFraction so the image fills the crop frame.
 */
export function initialZoomFraction(imageWidth: number, imageHeight: number, cropAspect: number): number {
	const imageAspect = imageWidth / imageHeight;
	return imageAspect > cropAspect ? cropAspect / imageAspect : 1.0;
}

/**
 * Apply a pan delta to crop state, clamping to valid bounds.
 * yScale = (imageWidth / imageHeight) / cropAspect — corrects Y-axis clamping
 * for images whose aspect ratio differs from the crop frame.
 */
export function applyPan(state: CropState, dxNorm: number, dyNorm: number, yScale: number): CropState {
	const maxOffsetX = Math.max(0, 1 - state.zoomFraction);
	const maxOffsetY = Math.max(0, 1 - state.zoomFraction * yScale);
	const newOffsetX = Math.max(0, Math.min(maxOffsetX, state.offsetX + dxNorm));
	const newOffsetY = Math.max(0, Math.min(maxOffsetY, state.offsetY + dyNorm));

	return {
		offsetX: newOffsetX,
		offsetY: newOffsetY,
		zoomFraction: state.zoomFraction,
	};
}

/**
 * Apply a zoom factor centered on a point within the crop frame.
 * centerXNorm, centerYNorm are 0-1 fractions within the crop frame.
 * yScale = (imageWidth / imageHeight) / cropAspect.
 * factor < 1 = zoom in, factor > 1 = zoom out.
 */
export function applyZoom(
	state: CropState,
	factor: number,
	centerXNorm: number,
	centerYNorm: number,
	yScale: number,
): CropState {
	const newZoom = Math.max(MIN_ZOOM_FRACTION, Math.min(1.0, state.zoomFraction * factor));

	const newOffsetX = state.offsetX + centerXNorm * (state.zoomFraction - newZoom);
	const newOffsetY = state.offsetY + centerYNorm * (state.zoomFraction - newZoom);

	const maxOffsetX = Math.max(0, 1 - newZoom);
	const maxOffsetY = Math.max(0, 1 - newZoom * yScale);
	const clampedOffsetX = Math.max(0, Math.min(maxOffsetX, newOffsetX));
	const clampedOffsetY = Math.max(0, Math.min(maxOffsetY, newOffsetY));

	return {
		offsetX: clampedOffsetX,
		offsetY: clampedOffsetY,
		zoomFraction: newZoom,
	};
}
