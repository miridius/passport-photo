import { describe, it, expect } from 'vitest';
import { AU_PASSPORT_SPEC, PRINT_SHEET, chinGuide, crownGuide } from './spec';

describe('AU_PASSPORT_SPEC', () => {
	it('has correct aspect ratio (photo content)', () => {
		expect(AU_PASSPORT_SPEC.aspectRatio).toBe(35 / 45);
	});

	it('has correct face height fractions', () => {
		expect(AU_PASSPORT_SPEC.faceHeightMinFrac).toBe(32 / 45);
		expect(AU_PASSPORT_SPEC.faceHeightMaxFrac).toBe(36 / 45);
	});

	it('has correct print export dimensions at 300 DPI', () => {
		expect(AU_PASSPORT_SPEC.printExport.widthPx).toBe(413);
		expect(AU_PASSPORT_SPEC.printExport.heightPx).toBe(531);
		expect(AU_PASSPORT_SPEC.printExport.dpi).toBe(300);
		expect(AU_PASSPORT_SPEC.printExport.format).toBe('jpeg');
		expect(AU_PASSPORT_SPEC.printExport.quality).toBe(1.0);
	});

	it('has correct digital export width', () => {
		expect(AU_PASSPORT_SPEC.digitalExport.widthPx).toBe(1200);
	});

	it('has photo dimension ranges (35-40mm x 45-50mm)', () => {
		expect(AU_PASSPORT_SPEC.photoWidthMinMm).toBe(35);
		expect(AU_PASSPORT_SPEC.photoWidthMaxMm).toBe(40);
		expect(AU_PASSPORT_SPEC.photoHeightMinMm).toBe(45);
		expect(AU_PASSPORT_SPEC.photoHeightMaxMm).toBe(50);
	});

	it('child rules under3 allows open mouth but NOT eye leniency', () => {
		expect(AU_PASSPORT_SPEC.childRules.under3.mouthMayBeOpen).toBe(true);
		expect(AU_PASSPORT_SPEC.childRules.under3.noToysOrObjects).toBe(true);
		expect('eyeLeniency' in AU_PASSPORT_SPEC.childRules.under3).toBe(false);
	});
});

describe('PRINT_SHEET', () => {
	it('has correct sheet dimensions', () => {
		expect(PRINT_SHEET.sheetWidthMm).toBe(90);
		expect(PRINT_SHEET.sheetHeightMm).toBe(130);
	});

	it('has correct tile dimensions', () => {
		expect(PRINT_SHEET.tileWidthMm).toBe(36);
		expect(PRINT_SHEET.tileHeightMm).toBe(46);
	});

	it('has correct photo dimensions within tile', () => {
		expect(PRINT_SHEET.photoWidthMm).toBe(35);
		expect(PRINT_SHEET.photoHeightMm).toBe(45);
	});

	it('has correct gap and inset', () => {
		expect(PRINT_SHEET.gapMm).toBe(5);
		expect(PRINT_SHEET.insetMm).toBe(0.5);
	});

	it('has correct grid layout (2x2)', () => {
		expect(PRINT_SHEET.cols).toBe(2);
		expect(PRINT_SHEET.rows).toBe(2);
	});

	it('has correct cut mark properties', () => {
		expect(PRINT_SHEET.cutMark.lengthMm).toBe(2);
		expect(PRINT_SHEET.cutMark.color).toBe('#333333');
	});

	it('margins are computable and correct', () => {
		const totalTileW = PRINT_SHEET.cols * PRINT_SHEET.tileWidthMm + (PRINT_SHEET.cols - 1) * PRINT_SHEET.gapMm;
		const totalTileH = PRINT_SHEET.rows * PRINT_SHEET.tileHeightMm + (PRINT_SHEET.rows - 1) * PRINT_SHEET.gapMm;
		const marginX = (PRINT_SHEET.sheetWidthMm - totalTileW) / 2;
		const marginY = (PRINT_SHEET.sheetHeightMm - totalTileH) / 2;
		// marginX = (90 - 2*36 - 5) / 2 = 6.5mm
		expect(marginX).toBeCloseTo(6.5);
		// marginY = (130 - 2*46 - 5) / 2 = 16.5mm
		expect(marginY).toBeCloseTo(16.5);
	});
});

describe('guide band positions (35:45 frame)', () => {
	it('crown band spans 4-7mm from top of 45mm frame (3mm wide)', () => {
		expect(crownGuide.topFrac).toBe(4 / 45);
		expect(crownGuide.bottomFrac).toBe(7 / 45);
	});

	it('chin bar spans 39-40mm from top of 45mm frame (1mm wide)', () => {
		expect(chinGuide.topFrac).toBe(39 / 45);
		expect(chinGuide.bottomFrac).toBe(40 / 45);
	});

	it('close edges are 32mm apart (min face height)', () => {
		const frameHeight = 45;
		const crownBottomMm = crownGuide.bottomFrac * frameHeight;
		const chinTopMm = chinGuide.topFrac * frameHeight;
		expect(chinTopMm - crownBottomMm).toBeCloseTo(32);
	});

	it('far edges are 36mm apart (max face height)', () => {
		const frameHeight = 45;
		const crownTopMm = crownGuide.topFrac * frameHeight;
		const chinBottomMm = chinGuide.bottomFrac * frameHeight;
		expect(chinBottomMm - crownTopMm).toBeCloseTo(36);
	});

	it('face is vertically centered in 45mm frame', () => {
		const crownCenter = (crownGuide.topFrac + crownGuide.bottomFrac) / 2;
		const chinCenter = (chinGuide.topFrac + chinGuide.bottomFrac) / 2;
		const faceCenter = (crownCenter + chinCenter) / 2;
		expect(faceCenter).toBeCloseTo(0.5);
	});
});
