import { describe, it, expect } from 'vitest';
import { wheelToZoomFactor, calculatePinchRatio } from './panZoom';

describe('wheelToZoomFactor', () => {
	it('returns >1 for positive deltaY (scroll down = zoom out)', () => {
		const factor = wheelToZoomFactor(100, false);
		expect(factor).toBeGreaterThan(1);
	});

	it('returns <1 for negative deltaY (scroll up = zoom in)', () => {
		const factor = wheelToZoomFactor(-100, false);
		expect(factor).toBeLessThan(1);
	});

	it('returns a consistent factor regardless of deltaY magnitude', () => {
		// Small and large deltas produce the same zoom step
		const small = wheelToZoomFactor(10, false);
		const large = wheelToZoomFactor(500, false);
		expect(small).toBe(large);
		// Normal scroll (no shift) = 5% per step (coarse, factor 1.05)
		expect(small).toBe(1.05);
	});

	it('returns inverse factors for opposite directions', () => {
		const zoomIn = wheelToZoomFactor(-100, false);
		const zoomOut = wheelToZoomFactor(100, false);
		expect(zoomIn * zoomOut).toBeCloseTo(1.0);
	});

	it('returns fine factor (1.01) with shiftKey=true', () => {
		const factor = wheelToZoomFactor(100, true);
		expect(factor).toBe(1.01);
	});

	it('returns inverse fine factor with shiftKey=true for opposite direction', () => {
		const zoomIn = wheelToZoomFactor(-100, true);
		const zoomOut = wheelToZoomFactor(100, true);
		expect(zoomIn * zoomOut).toBeCloseTo(1.0);
		expect(zoomIn).toBeCloseTo(1 / 1.01);
	});

	it('coarse factor (no shift) is farther from 1 than fine factor (shift)', () => {
		const coarse = wheelToZoomFactor(100, false);
		const fine = wheelToZoomFactor(100, true);
		// Both >1, coarse (no shift) should be larger (farther from 1)
		expect(coarse - 1).toBeGreaterThan(fine - 1);
	});

	it('uses deltaX as fallback when deltaY is 0 (browser shift+scroll)', () => {
		// Browsers convert shift+scroll from vertical to horizontal
		const zoomOut = wheelToZoomFactor(0, true, 100);
		expect(zoomOut).toBe(1.01);
		const zoomIn = wheelToZoomFactor(0, true, -100);
		expect(zoomIn).toBeCloseTo(1 / 1.01);
	});

	it('returns 1 (no zoom) when both deltaY and deltaX are 0', () => {
		expect(wheelToZoomFactor(0, false, 0)).toBe(1);
		expect(wheelToZoomFactor(0, true, 0)).toBe(1);
		expect(wheelToZoomFactor(0)).toBe(1);
	});
});

describe('calculatePinchRatio', () => {
	it('returns <1 when fingers move apart (zoom in)', () => {
		const prev = [
			{ x: 100, y: 100 },
			{ x: 200, y: 100 },
		];
		const curr = [
			{ x: 50, y: 100 },
			{ x: 250, y: 100 },
		];
		const ratio = calculatePinchRatio(prev, curr);
		// prev distance = 100, curr distance = 200, ratio = 100/200 = 0.5 (zoom in)
		expect(ratio).toBeLessThan(1);
	});

	it('returns >1 when fingers move together (zoom out)', () => {
		const prev = [
			{ x: 50, y: 100 },
			{ x: 250, y: 100 },
		];
		const curr = [
			{ x: 100, y: 100 },
			{ x: 200, y: 100 },
		];
		const ratio = calculatePinchRatio(prev, curr);
		// prev distance = 200, curr distance = 100, ratio = 200/100 = 2.0 (zoom out)
		expect(ratio).toBeGreaterThan(1);
	});

	it('returns 1 when distance unchanged', () => {
		const prev = [
			{ x: 100, y: 100 },
			{ x: 200, y: 100 },
		];
		const curr = [
			{ x: 150, y: 50 },
			{ x: 150, y: 150 },
		];
		// Both distances = 100
		const ratio = calculatePinchRatio(prev, curr);
		expect(ratio).toBeCloseTo(1);
	});

	it('handles zero previous distance gracefully', () => {
		const prev = [
			{ x: 100, y: 100 },
			{ x: 100, y: 100 },
		];
		const curr = [
			{ x: 50, y: 100 },
			{ x: 150, y: 100 },
		];
		const ratio = calculatePinchRatio(prev, curr);
		// Zero prev distance should return 1 (no zoom) to avoid division by zero
		expect(ratio).toBe(1);
	});

	it('handles zero current distance gracefully', () => {
		const prev = [
			{ x: 50, y: 100 },
			{ x: 150, y: 100 },
		];
		const curr = [
			{ x: 100, y: 100 },
			{ x: 100, y: 100 },
		];
		const ratio = calculatePinchRatio(prev, curr);
		// Zero curr distance — fingers converged. Return 1 to avoid extreme zoom.
		expect(ratio).toBe(1);
	});
});
