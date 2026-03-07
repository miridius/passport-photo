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
