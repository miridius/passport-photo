import { describe, it, expect } from 'vitest';
import { calculateSourceRect } from './export';

describe('calculateSourceRect', () => {
	it('computes correct source rect for partial crop', () => {
		const rect = calculateSourceRect(
			{ offsetX: 0.1, offsetY: 0.2, zoomFraction: 0.5 },
			4000,
			3000,
			413,
			531,
		);
		expect(rect.sx).toBeCloseTo(400);
		expect(rect.sy).toBeCloseTo(600);
		expect(rect.sw).toBeCloseTo(2000);
		expect(rect.sh).toBeCloseTo(2000 * (531 / 413));
	});

	it('computes correct source rect for full-image view', () => {
		const rect = calculateSourceRect(
			{ offsetX: 0, offsetY: 0, zoomFraction: 1.0 },
			4000,
			3000,
			413,
			531,
		);
		expect(rect.sx).toBe(0);
		expect(rect.sy).toBe(0);
		expect(rect.sw).toBe(4000);
		expect(rect.sh).toBeCloseTo(4000 * (531 / 413));
	});

	it('computes correct source rect for digital export target', () => {
		const rect = calculateSourceRect(
			{ offsetX: 0.05, offsetY: 0.1, zoomFraction: 0.8 },
			5000,
			4000,
			1200,
			1600,
		);
		expect(rect.sx).toBeCloseTo(250);
		expect(rect.sy).toBeCloseTo(400);
		expect(rect.sw).toBeCloseTo(4000);
		expect(rect.sh).toBeCloseTo(4000 * (1600 / 1200));
	});

	it('preserves target aspect ratio in source rect for various inputs', () => {
		const cases = [
			{ crop: { offsetX: 0, offsetY: 0, zoomFraction: 1.0 }, nw: 4000, nh: 3000, tw: 413, th: 531 },
			{ crop: { offsetX: 0.2, offsetY: 0.1, zoomFraction: 0.5 }, nw: 5000, nh: 4000, tw: 1200, th: 1600 },
			{ crop: { offsetX: 0, offsetY: 0, zoomFraction: 0.3 }, nw: 3000, nh: 6000, tw: 35, th: 45 },
			{ crop: { offsetX: 0.5, offsetY: 0.5, zoomFraction: 0.1 }, nw: 8000, nh: 6000, tw: 600, th: 800 },
		];
		for (const { crop, nw, nh, tw, th } of cases) {
			const rect = calculateSourceRect(crop, nw, nh, tw, th);
			expect(rect.sw / rect.sh).toBeCloseTo(tw / th);
		}
	});

	it('handles minimum zoom fraction', () => {
		const rect = calculateSourceRect(
			{ offsetX: 0, offsetY: 0, zoomFraction: 0.01 },
			4000,
			3000,
			413,
			531,
		);
		expect(rect.sx).toBe(0);
		expect(rect.sy).toBe(0);
		expect(rect.sw).toBeCloseTo(40);
		expect(rect.sh).toBeCloseTo(40 * (531 / 413));
	});
});
