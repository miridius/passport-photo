import { describe, it, expect } from 'vitest';
import { calculateSheetLayout, expandSourceRect } from './printSheet';
import type { SheetLayout, TilePosition } from './printSheet';

describe('calculateSheetLayout', () => {
	const layout = calculateSheetLayout();
	const pxPerMm = 300 / 25.4;

	it('returns correct sheet dimensions at 300 DPI', () => {
		expect(layout.sheetWidthPx).toBe(Math.round(90 * pxPerMm));
		expect(layout.sheetHeightPx).toBe(Math.round(130 * pxPerMm));
	});

	it('returns correct pxPerMm for 300 DPI', () => {
		expect(layout.pxPerMm).toBeCloseTo(pxPerMm);
	});

	it('returns exactly 4 tiles', () => {
		expect(layout.tiles).toHaveLength(4);
	});

	it('positions tile [0,0] correctly', () => {
		const tile = layout.tiles[0];
		// marginX = (90 - 2*36 - 5) / 2 = 6.5mm
		// marginY = (130 - 2*46 - 5) / 2 = 16.5mm
		expect(tile.tileX).toBe(Math.round(6.5 * pxPerMm));
		expect(tile.tileY).toBe(Math.round(16.5 * pxPerMm));
		expect(tile.photoX).toBe(Math.round(7 * pxPerMm));
		expect(tile.photoY).toBe(Math.round(17 * pxPerMm));
		expect(tile.photoWidthPx).toBe(Math.round(35 * pxPerMm));
		expect(tile.photoHeightPx).toBe(Math.round(45 * pxPerMm));
	});

	it('positions tile [0,1] correctly (second column)', () => {
		const tile = layout.tiles[1];
		// tileX = 6.5 + 36 + 5 = 47.5mm
		expect(tile.tileX).toBe(Math.round(47.5 * pxPerMm));
		expect(tile.tileY).toBe(Math.round(16.5 * pxPerMm));
	});

	it('positions tile [1,0] correctly (second row)', () => {
		const tile = layout.tiles[2];
		// tileY = 16.5 + 46 + 5 = 67.5mm
		expect(tile.tileX).toBe(Math.round(6.5 * pxPerMm));
		expect(tile.tileY).toBe(Math.round(67.5 * pxPerMm));
	});

	it('positions tile [1,1] correctly (second row, second column)', () => {
		const tile = layout.tiles[3];
		expect(tile.tileX).toBe(Math.round(47.5 * pxPerMm));
		expect(tile.tileY).toBe(Math.round(67.5 * pxPerMm));
	});

	it('produces symmetric margins', () => {
		const tile00 = layout.tiles[0];
		const tile11 = layout.tiles[3];
		// Left margin = tile00.tileX
		const leftMargin = tile00.tileX;
		// Right margin = sheetWidth - (tile11.tileX + tileWidthPx)
		const tileWidthPx = Math.round(36 * layout.pxPerMm);
		const rightMargin = layout.sheetWidthPx - (tile11.tileX + tileWidthPx);
		expect(leftMargin).toBe(rightMargin);

		// Top margin = tile00.tileY
		const topMargin = tile00.tileY;
		// Bottom margin = sheetHeight - (tile11.tileY + tileHeightPx)
		const tileHeightPx = Math.round(46 * layout.pxPerMm);
		const bottomMargin = layout.sheetHeightPx - (tile11.tileY + tileHeightPx);
		expect(topMargin).toBe(bottomMargin);
	});

	it('photo dimensions match 35x45mm at 300 DPI', () => {
		const tile = layout.tiles[0];
		expect(tile.photoWidthPx).toBe(Math.round(35 * pxPerMm));
		expect(tile.photoHeightPx).toBe(Math.round(45 * pxPerMm));
	});
});

describe('drawCutMarks', () => {
	// Helper: create a mock ctx that records fillRect calls
	function createMockCtx() {
		const fillRects: { x: number; y: number; w: number; h: number }[] = [];
		const ctx = {
			fillStyle: '',
			fillRect: (x: number, y: number, w: number, h: number) =>
				fillRects.push({ x, y, w, h }),
		} as unknown as CanvasRenderingContext2D;
		return { ctx, fillRects };
	}

	it('CUT_MARK_LENGTH_MM equals 2 (verified via arm geometry)', async () => {
		const { drawCutMarks } = await import('./printSheet');
		const layout = calculateSheetLayout();
		const tile = layout.tiles[0];
		const { ctx, fillRects } = createMockCtx();

		drawCutMarks(ctx, tile, layout.pxPerMm);

		// Top-left horizontal arm width should be 2mm * 10 = 20px
		const armLengthPx = 2 * layout.pxPerMm;
		expect(fillRects[0].w).toBe(armLengthPx);
	});

	it('draws 8 fillRect calls per tile (4 corners x 2 arms)', async () => {
		const { drawCutMarks } = await import('./printSheet');
		const layout = calculateSheetLayout();
		const tile = layout.tiles[0];
		const { ctx, fillRects } = createMockCtx();

		drawCutMarks(ctx, tile, layout.pxPerMm);

		expect(fillRects).toHaveLength(8);
	});

	it('sets fillStyle to cut mark color', async () => {
		const { drawCutMarks } = await import('./printSheet');
		const layout = calculateSheetLayout();
		const tile = layout.tiles[0];
		const { ctx, fillRects } = createMockCtx();

		drawCutMarks(ctx, tile, layout.pxPerMm);

		expect(ctx.fillStyle).toBe('#333333');
	});

	it('top-left horizontal arm: 2mm x 0.5mm rect extending LEFT from tile edge', async () => {
		const { drawCutMarks } = await import('./printSheet');
		const layout = calculateSheetLayout();
		const tile = layout.tiles[0];
		const { ctx, fillRects } = createMockCtx();

		drawCutMarks(ctx, tile, layout.pxPerMm);

		const armLength = 2 * layout.pxPerMm; // 20px
		const armWidth = 0.5 * layout.pxPerMm; // 5px

		// Horizontal arm extends LEFT from tile left edge
		const h = fillRects[0];
		expect(h.x).toBe(tile.tileX - armLength);
		expect(h.y).toBe(tile.tileY);
		expect(h.w).toBe(armLength);
		expect(h.h).toBe(armWidth);
	});

	it('top-left vertical arm: 0.5mm x 2mm rect extending UP from tile top edge', async () => {
		const { drawCutMarks } = await import('./printSheet');
		const layout = calculateSheetLayout();
		const tile = layout.tiles[0];
		const { ctx, fillRects } = createMockCtx();

		drawCutMarks(ctx, tile, layout.pxPerMm);

		const armLength = 2 * layout.pxPerMm; // 20px
		const armWidth = 0.5 * layout.pxPerMm; // 5px

		// Vertical arm extends UP from tile top edge
		const v = fillRects[1];
		expect(v.x).toBe(tile.tileX);
		expect(v.y).toBe(tile.tileY - armLength);
		expect(v.w).toBe(armWidth);
		expect(v.h).toBe(armLength);
	});

	it('bottom-right horizontal arm extends RIGHT from tile right edge', async () => {
		const { drawCutMarks } = await import('./printSheet');
		const layout = calculateSheetLayout();
		const tile = layout.tiles[0];
		const { ctx, fillRects } = createMockCtx();

		drawCutMarks(ctx, tile, layout.pxPerMm);

		const armLength = 2 * layout.pxPerMm;
		const armWidth = 0.5 * layout.pxPerMm;
		const tileRight = tile.tileX + 36 * layout.pxPerMm;
		const tileBottom = tile.tileY + 46 * layout.pxPerMm;

		// Bottom-right horizontal arm: index 6 (4th corner, 1st arm)
		const h = fillRects[6];
		expect(h.x).toBe(tileRight);
		expect(h.y).toBe(tileBottom - armWidth);
		expect(h.w).toBe(armLength);
		expect(h.h).toBe(armWidth);
	});

	it('bottom-right vertical arm extends DOWN from tile bottom edge', async () => {
		const { drawCutMarks } = await import('./printSheet');
		const layout = calculateSheetLayout();
		const tile = layout.tiles[0];
		const { ctx, fillRects } = createMockCtx();

		drawCutMarks(ctx, tile, layout.pxPerMm);

		const armLength = 2 * layout.pxPerMm;
		const armWidth = 0.5 * layout.pxPerMm;
		const tileRight = tile.tileX + 36 * layout.pxPerMm;
		const tileBottom = tile.tileY + 46 * layout.pxPerMm;

		// Bottom-right vertical arm: index 7 (4th corner, 2nd arm)
		const v = fillRects[7];
		expect(v.x).toBe(tileRight - armWidth);
		expect(v.y).toBe(tileBottom);
		expect(v.w).toBe(armWidth);
		expect(v.h).toBe(armLength);
	});

	it('each arm is either (armLength x armWidth) or (armWidth x armLength)', async () => {
		const { drawCutMarks } = await import('./printSheet');
		const layout = calculateSheetLayout();
		const tile = layout.tiles[0];
		const { ctx, fillRects } = createMockCtx();

		drawCutMarks(ctx, tile, layout.pxPerMm);

		const armLength = 2 * layout.pxPerMm;
		const armWidth = 0.5 * layout.pxPerMm;

		for (const rect of fillRects) {
			const isHorizontal = rect.w === armLength && rect.h === armWidth;
			const isVertical = rect.w === armWidth && rect.h === armLength;
			expect(isHorizontal || isVertical).toBe(true);
		}
	});

	it('no fillRect overlaps the tile interior (photo area)', async () => {
		const { drawCutMarks } = await import('./printSheet');
		const layout = calculateSheetLayout();

		for (const tile of layout.tiles) {
			const { ctx, fillRects } = createMockCtx();
			drawCutMarks(ctx, tile, layout.pxPerMm);

			const tileLeft = tile.tileX;
			const tileRight = tile.tileX + 36 * layout.pxPerMm;
			const tileTop = tile.tileY;
			const tileBottom = tile.tileY + 46 * layout.pxPerMm;

			for (const rect of fillRects) {
				// Rect is fully outside tile if any of these hold:
				// rect right edge <= tileLeft, or rect left edge >= tileRight
				// rect bottom edge <= tileTop, or rect top edge >= tileBottom
				const outsideH = rect.x + rect.w <= tileLeft || rect.x >= tileRight;
				const outsideV = rect.y + rect.h <= tileTop || rect.y >= tileBottom;
				expect(outsideH || outsideV).toBe(true);
			}
		}
	});
});

describe('expandSourceRect', () => {
	it('expands by 0.5mm on each side for 35x45 -> 36x46', () => {
		// Base: 35mm wide, 45mm tall crop starting at (100, 200) in source pixels
		// where 1mm = 10 source pixels
		const base = { sx: 100, sy: 200, sw: 350, sh: 450 };
		const expanded = expandSourceRect(base, 35, 45, 0.5);

		// 0.5mm = 5 source pixels (350/35 = 10 px/mm)
		expect(expanded.sx).toBe(95); // 100 - 5
		expect(expanded.sy).toBe(195); // 200 - 5
		expect(expanded.sw).toBe(360); // 350 + 10
		expect(expanded.sh).toBe(460); // 450 + 10
	});

	it('produces correct dimensions ratio (36/35 wide, 46/45 tall)', () => {
		const base = { sx: 50, sy: 80, sw: 700, sh: 900 };
		const expanded = expandSourceRect(base, 35, 45, 0.5);

		expect(expanded.sw / base.sw).toBeCloseTo(36 / 35);
		expect(expanded.sh / base.sh).toBeCloseTo(46 / 45);
	});

	it('centers the expansion (base center unchanged)', () => {
		const base = { sx: 100, sy: 200, sw: 350, sh: 450 };
		const expanded = expandSourceRect(base, 35, 45, 0.5);

		const baseCenterX = base.sx + base.sw / 2;
		const expandedCenterX = expanded.sx + expanded.sw / 2;
		expect(expandedCenterX).toBeCloseTo(baseCenterX);

		const baseCenterY = base.sy + base.sh / 2;
		const expandedCenterY = expanded.sy + expanded.sh / 2;
		expect(expandedCenterY).toBeCloseTo(baseCenterY);
	});
});
