/**
 * Pure function to compute CSS transform values from normalized crop state.
 * Extracted from CropEditor for testability.
 */

export interface TransformInput {
	offsetX: number;
	offsetY: number;
	zoomFraction: number;
	imageNaturalWidth: number;
	imageNaturalHeight: number;
	frameWidth: number;
}

export interface TransformOutput {
	scaleFactor: number;
	panXpx: number;
	panYpx: number;
}

export type KeyAction = 'panLeft' | 'panRight' | 'panUp' | 'panDown' | 'zoomIn' | 'zoomOut' | null;

export function keyToAction(key: string): KeyAction {
	switch (key) {
		case 'ArrowLeft': return 'panLeft';
		case 'ArrowRight': return 'panRight';
		case 'ArrowUp': return 'panUp';
		case 'ArrowDown': return 'panDown';
		case '+': case '=': return 'zoomIn';
		case '-': case '_': return 'zoomOut';
		default: return null;
	}
}

export function computeTransform(input: TransformInput): TransformOutput {
	const { offsetX, offsetY, zoomFraction, imageNaturalWidth, imageNaturalHeight, frameWidth } =
		input;

	if (zoomFraction <= 0 || imageNaturalWidth <= 0) {
		return { scaleFactor: 0, panXpx: 0, panYpx: 0 };
	}

	// How many CSS pixels per source pixel
	const scaleFactor = frameWidth / (zoomFraction * imageNaturalWidth);

	// Convert normalized offsets to screen pixels
	const panXpx = -offsetX * imageNaturalWidth * scaleFactor;
	const panYpx = -offsetY * imageNaturalHeight * scaleFactor;

	return { scaleFactor, panXpx, panYpx };
}
