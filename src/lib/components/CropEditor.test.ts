import { describe, it, expect } from 'vitest';

/**
 * Tests for CropEditor's CSS transform calculation logic.
 * The component converts normalized cropState to screen-pixel transforms.
 */

// Extract the transform math as pure functions for testing
import { computeTransform, keyToAction } from './cropTransform';

describe('computeTransform', () => {
	const imageNaturalWidth = 4000;
	const imageNaturalHeight = 3000;
	const frameWidth = 350; // CSS pixels of the crop frame

	it('calculates scaleFactor from frame width, zoom fraction, and image width', () => {
		const result = computeTransform({
			offsetX: 0,
			offsetY: 0,
			zoomFraction: 0.5,
			imageNaturalWidth,
			imageNaturalHeight,
			frameWidth,
		});
		// scaleFactor = frameWidth / (zoomFraction * imageNaturalWidth) = 350 / (0.5 * 4000) = 0.175
		expect(result.scaleFactor).toBeCloseTo(0.175);
	});

	it('calculates panX from offsetX', () => {
		const result = computeTransform({
			offsetX: 0.2,
			offsetY: 0,
			zoomFraction: 0.5,
			imageNaturalWidth,
			imageNaturalHeight,
			frameWidth,
		});
		// panXpx = -offsetX * naturalWidth * scaleFactor = -0.2 * 4000 * 0.175 = -140
		expect(result.panXpx).toBeCloseTo(-140);
	});

	it('calculates panY from offsetY', () => {
		const result = computeTransform({
			offsetX: 0,
			offsetY: 0.3,
			zoomFraction: 0.5,
			imageNaturalWidth,
			imageNaturalHeight,
			frameWidth,
		});
		// panYpx = -offsetY * naturalHeight * scaleFactor = -0.3 * 3000 * 0.175 = -157.5
		expect(result.panYpx).toBeCloseTo(-157.5);
	});

	it('returns zero transforms when offsets are zero', () => {
		const result = computeTransform({
			offsetX: 0,
			offsetY: 0,
			zoomFraction: 1.0,
			imageNaturalWidth,
			imageNaturalHeight,
			frameWidth,
		});
		expect(result.panXpx).toBeCloseTo(0);
		expect(result.panYpx).toBeCloseTo(0);
	});

	it('scales correctly at full zoom (zoomFraction=1)', () => {
		const result = computeTransform({
			offsetX: 0,
			offsetY: 0,
			zoomFraction: 1.0,
			imageNaturalWidth,
			imageNaturalHeight,
			frameWidth,
		});
		// scaleFactor = 350 / (1.0 * 4000) = 0.0875
		expect(result.scaleFactor).toBeCloseTo(0.0875);
	});

	it('returns safe defaults when zoomFraction is 0', () => {
		const result = computeTransform({
			offsetX: 0,
			offsetY: 0,
			zoomFraction: 0,
			imageNaturalWidth,
			imageNaturalHeight,
			frameWidth,
		});
		expect(result.scaleFactor).toBe(0);
		expect(result.panXpx).toBe(0);
		expect(result.panYpx).toBe(0);
	});

	it('returns safe defaults when imageNaturalWidth is 0', () => {
		const result = computeTransform({
			offsetX: 0,
			offsetY: 0,
			zoomFraction: 0.5,
			imageNaturalWidth: 0,
			imageNaturalHeight: 3000,
			frameWidth,
		});
		expect(result.scaleFactor).toBe(0);
	});
});

describe('keyToAction', () => {
	it('maps arrow keys to pan actions', () => {
		expect(keyToAction('ArrowLeft')).toBe('panLeft');
		expect(keyToAction('ArrowRight')).toBe('panRight');
		expect(keyToAction('ArrowUp')).toBe('panUp');
		expect(keyToAction('ArrowDown')).toBe('panDown');
	});

	it('maps + and = to zoomIn', () => {
		expect(keyToAction('+')).toBe('zoomIn');
		expect(keyToAction('=')).toBe('zoomIn');
	});

	it('maps - and _ (shift+minus) to zoomOut', () => {
		expect(keyToAction('-')).toBe('zoomOut');
		expect(keyToAction('_')).toBe('zoomOut');
	});

	it('returns null for unrecognized keys', () => {
		expect(keyToAction('a')).toBeNull();
		expect(keyToAction('Enter')).toBeNull();
	});
});
