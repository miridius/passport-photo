import { describe, it, expect } from 'vitest';
import { applyPan, applyZoom, initialZoomFraction, DEFAULT_CROP } from './crop';
import type { CropState } from '../types';

// yScale for a square image at 35:45 crop = (1/1) / (35/45) = 45/35 ≈ 1.286
const SQUARE_YSCALE = 1 / (35 / 45);
// yScale for a 4:3 landscape = (4/3) / (35/45) = 12/7 ≈ 1.714
const LANDSCAPE_YSCALE = (4 / 3) / (35 / 45);
// yScale for a 1:2 tall portrait = (1/2) / (35/45) = 9/14 ≈ 0.643
const PORTRAIT_YSCALE = (1 / 2) / (35 / 45);

describe('DEFAULT_CROP', () => {
	it('initializes with offsetX=0, offsetY=0, zoomFraction=1.0', () => {
		expect(DEFAULT_CROP.offsetX).toBe(0);
		expect(DEFAULT_CROP.offsetY).toBe(0);
		expect(DEFAULT_CROP.zoomFraction).toBe(1.0);
	});
});

describe('initialZoomFraction', () => {
	const cropAspect = 35 / 45;

	it('returns cropAspect/imageAspect for landscape images', () => {
		// 4000x3000 landscape: imageAspect = 4/3
		const zoom = initialZoomFraction(4000, 3000, cropAspect);
		expect(zoom).toBeCloseTo(cropAspect / (4 / 3));
	});

	it('returns 1.0 for portrait images taller than crop ratio', () => {
		// 2000x4000 tall portrait: imageAspect = 0.5 < cropAspect
		const zoom = initialZoomFraction(2000, 4000, cropAspect);
		expect(zoom).toBe(1.0);
	});

	it('returns 1.0 for image matching crop aspect ratio', () => {
		const zoom = initialZoomFraction(3500, 4500, cropAspect);
		expect(zoom).toBeCloseTo(1.0);
	});

	it('returns cropAspect for square image (wider than crop ratio)', () => {
		// Square: imageAspect = 1.0 > cropAspect (0.778), so it is landscape-ish
		const zoom = initialZoomFraction(3000, 3000, cropAspect);
		expect(zoom).toBeCloseTo(cropAspect / 1.0);
	});
});

describe('applyPan', () => {
	const base: CropState = { offsetX: 0.2, offsetY: 0.2, zoomFraction: 0.5 };

	it('adds delta to offset', () => {
		const result = applyPan(base, 0.1, 0.1, SQUARE_YSCALE);
		expect(result.offsetX).toBeCloseTo(0.3);
		expect(result.offsetY).toBeCloseTo(0.3);
	});

	it('clamps offsetX to minimum 0', () => {
		const result = applyPan(base, -0.6, 0, SQUARE_YSCALE);
		expect(result.offsetX).toBe(0);
	});

	it('clamps offsetY to minimum 0', () => {
		const result = applyPan(base, 0, -0.6, SQUARE_YSCALE);
		expect(result.offsetY).toBe(0);
	});

	it('clamps offsetX to maximum (1 - zoomFraction)', () => {
		const result = applyPan(base, 0.6, 0, SQUARE_YSCALE);
		expect(result.offsetX).toBe(1 - base.zoomFraction);
	});

	it('clamps offsetY to maximum (1 - zoomFraction * yScale)', () => {
		const result = applyPan(base, 0, 0.6, LANDSCAPE_YSCALE);
		const maxY = Math.max(0, 1 - base.zoomFraction * LANDSCAPE_YSCALE);
		expect(result.offsetY).toBeCloseTo(maxY);
	});

	it('preserves zoomFraction', () => {
		const result = applyPan(base, 0.1, 0.1, SQUARE_YSCALE);
		expect(result.zoomFraction).toBe(base.zoomFraction);
	});

	it('does not mutate input state', () => {
		const input = { offsetX: 0.2, offsetY: 0.2, zoomFraction: 0.5 };
		const copy = { ...input };
		applyPan(input, 0.1, 0.1, SQUARE_YSCALE);
		expect(input).toEqual(copy);
	});

	it('prevents panning when zoomFraction=1.0 on square image', () => {
		const fullZoom: CropState = { offsetX: 0, offsetY: 0, zoomFraction: 1.0 };
		// yScale > 1 for square image, so maxOffsetY = max(0, 1 - 1.0 * 1.286) = 0
		const result = applyPan(fullZoom, 0.5, 0.5, SQUARE_YSCALE);
		expect(result.offsetX).toBe(0);
		expect(result.offsetY).toBe(0);
	});

	it('allows vertical panning for tall portrait at full zoom', () => {
		const fullZoom: CropState = { offsetX: 0, offsetY: 0, zoomFraction: 1.0 };
		// yScale < 1 for tall portrait, so maxOffsetY = 1 - 1.0 * 0.643 = 0.357
		const result = applyPan(fullZoom, 0, 0.5, PORTRAIT_YSCALE);
		expect(result.offsetX).toBe(0); // can't pan X at full zoom
		expect(result.offsetY).toBeGreaterThan(0); // CAN pan Y
		expect(result.offsetY).toBeCloseTo(1 - PORTRAIT_YSCALE);
	});

	it('restricts vertical panning for landscape images', () => {
		const state: CropState = { offsetX: 0, offsetY: 0, zoomFraction: 0.5 };
		// Landscape yScale ≈ 1.714, so maxOffsetY = max(0, 1 - 0.5 * 1.714) = 0.143
		const maxY = Math.max(0, 1 - 0.5 * LANDSCAPE_YSCALE);
		const result = applyPan(state, 0, 1.0, LANDSCAPE_YSCALE);
		expect(result.offsetY).toBeCloseTo(maxY);
		// Compare to X: maxOffsetX = 0.5
		expect(result.offsetY).toBeLessThan(1 - state.zoomFraction);
	});
});

describe('applyZoom', () => {
	const base: CropState = { offsetX: 0.25, offsetY: 0.25, zoomFraction: 0.5 };

	it('multiplies zoomFraction by factor', () => {
		const result = applyZoom(base, 0.5, 0.5, 0.5, SQUARE_YSCALE);
		expect(result.zoomFraction).toBeCloseTo(0.25);
	});

	it('clamps zoomFraction to maximum 1.0 (cannot zoom out past image)', () => {
		const result = applyZoom(base, 3.0, 0.5, 0.5, SQUARE_YSCALE);
		expect(result.zoomFraction).toBeLessThanOrEqual(1.0);
	});

	it('clamps zoomFraction to minimum (cannot zoom in beyond reason)', () => {
		const result = applyZoom(base, 0.001, 0.5, 0.5, SQUARE_YSCALE);
		expect(result.zoomFraction).toBeGreaterThan(0);
	});

	it('adjusts offset to keep zoom center stable', () => {
		const centered: CropState = { offsetX: 0.25, offsetY: 0.25, zoomFraction: 0.5 };
		const result = applyZoom(centered, 0.5, 0.5, 0.5, SQUARE_YSCALE);
		const centerBefore = centered.offsetX + 0.5 * centered.zoomFraction;
		const centerAfter = result.offsetX + 0.5 * result.zoomFraction;
		expect(centerAfter).toBeCloseTo(centerBefore, 5);
	});

	it('does not mutate input state', () => {
		const input = { offsetX: 0.25, offsetY: 0.25, zoomFraction: 0.5 };
		const copy = { ...input };
		applyZoom(input, 0.5, 0.5, 0.5, SQUARE_YSCALE);
		expect(input).toEqual(copy);
	});

	it('stays at max zoom when already zoomed out fully', () => {
		const maxed: CropState = { offsetX: 0, offsetY: 0, zoomFraction: 1.0 };
		const result = applyZoom(maxed, 2.0, 0.5, 0.5, SQUARE_YSCALE);
		expect(result.zoomFraction).toBe(1.0);
		expect(result.offsetX).toBe(0);
		expect(result.offsetY).toBe(0);
	});

	it('clamps Y offset correctly for landscape images after zoom', () => {
		const state: CropState = { offsetX: 0.2, offsetY: 0.2, zoomFraction: 0.3 };
		const result = applyZoom(state, 0.5, 0.5, 0.5, LANDSCAPE_YSCALE);
		const maxY = Math.max(0, 1 - result.zoomFraction * LANDSCAPE_YSCALE);
		expect(result.offsetY).toBeLessThanOrEqual(maxY + 1e-10);
	});
});
