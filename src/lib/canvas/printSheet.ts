import { changeDpiBlob } from 'changedpi';
import type { CropState } from '$lib/types';
import { PRINT_SHEET } from '$lib/state/spec';
import { calculateSourceRect, type SourceRect } from './export';

const {
	sheetWidthMm: SHEET_WIDTH_MM,
	sheetHeightMm: SHEET_HEIGHT_MM,
	tileWidthMm: TILE_WIDTH_MM,
	tileHeightMm: TILE_HEIGHT_MM,
	photoWidthMm: PHOTO_WIDTH_MM,
	photoHeightMm: PHOTO_HEIGHT_MM,
	gapMm: GAP_MM,
	insetMm: INSET_MM,
	cols: COLS,
	rows: ROWS,
	cutMark: { lengthMm: CUT_MARK_LENGTH_MM, color: CUT_MARK_COLOR },
} = PRINT_SHEET;

const PRINT_DPI = 300;
const PX_PER_MM = PRINT_DPI / 25.4;

export interface TilePosition {
	tileX: number;
	tileY: number;
	photoX: number;
	photoY: number;
	photoWidthPx: number;
	photoHeightPx: number;
}

export interface SheetLayout {
	sheetWidthPx: number;
	sheetHeightPx: number;
	tiles: TilePosition[];
	pxPerMm: number;
}

/**
 * Expand a source rectangle by a fixed mm amount on each side.
 * Used to produce a 36x46mm crop from a 35x45mm one, filling the buffer zone.
 */
export function expandSourceRect(
	base: SourceRect,
	photoWidthMm: number,
	photoHeightMm: number,
	expandMm: number,
): SourceRect {
	const srcPxPerMmH = base.sw / photoWidthMm;
	const srcPxPerMmV = base.sh / photoHeightMm;
	return {
		sx: base.sx - expandMm * srcPxPerMmH,
		sy: base.sy - expandMm * srcPxPerMmV,
		sw: base.sw + 2 * expandMm * srcPxPerMmH,
		sh: base.sh + 2 * expandMm * srcPxPerMmV,
	};
}

/**
 * Calculate the pixel layout for a 9x13cm print sheet with 4 passport photos.
 * Pure function -- no DOM dependency. Uses fixed 300 DPI so pixel dimensions
 * match the embedded DPI metadata and print at the correct physical size.
 */
export function calculateSheetLayout(): SheetLayout {
	const pxPerMm = PX_PER_MM;

	const totalTileW = COLS * TILE_WIDTH_MM + (COLS - 1) * GAP_MM;
	const totalTileH = ROWS * TILE_HEIGHT_MM + (ROWS - 1) * GAP_MM;
	const marginX = (SHEET_WIDTH_MM - totalTileW) / 2;
	const marginY = (SHEET_HEIGHT_MM - totalTileH) / 2;

	const tiles: TilePosition[] = [];
	for (let row = 0; row < ROWS; row++) {
		for (let col = 0; col < COLS; col++) {
			const tileXmm = marginX + col * (TILE_WIDTH_MM + GAP_MM);
			const tileYmm = marginY + row * (TILE_HEIGHT_MM + GAP_MM);
			tiles.push({
				tileX: Math.round(tileXmm * pxPerMm),
				tileY: Math.round(tileYmm * pxPerMm),
				photoX: Math.round((tileXmm + INSET_MM) * pxPerMm),
				photoY: Math.round((tileYmm + INSET_MM) * pxPerMm),
				photoWidthPx: Math.round(PHOTO_WIDTH_MM * pxPerMm),
				photoHeightPx: Math.round(PHOTO_HEIGHT_MM * pxPerMm),
			});
		}
	}

	return {
		sheetWidthPx: Math.round(SHEET_WIDTH_MM * pxPerMm),
		sheetHeightPx: Math.round(SHEET_HEIGHT_MM * pxPerMm),
		tiles,
		pxPerMm,
	};
}

/**
 * Draw cut marks at the 4 corners of a tile boundary.
 * Each corner has 2 filled-rect arms (horizontal + vertical) extending
 * outward from the tile edge into the gap/margin area.
 * Arms are 2mm long x 0.5mm wide (matching buffer zone width).
 */
export function drawCutMarks(
	ctx: CanvasRenderingContext2D,
	tile: TilePosition,
	pxPerMm: number,
): void {
	const armLength = CUT_MARK_LENGTH_MM * pxPerMm;
	const armWidth = INSET_MM * pxPerMm;

	ctx.fillStyle = CUT_MARK_COLOR;

	const tileRight = tile.tileX + TILE_WIDTH_MM * pxPerMm;
	const tileBottom = tile.tileY + TILE_HEIGHT_MM * pxPerMm;

	// Top-left: horizontal arm extends LEFT, vertical arm extends UP
	ctx.fillRect(tile.tileX - armLength, tile.tileY, armLength, armWidth);
	ctx.fillRect(tile.tileX, tile.tileY - armLength, armWidth, armLength);

	// Top-right: horizontal arm extends RIGHT, vertical arm extends UP
	ctx.fillRect(tileRight, tile.tileY, armLength, armWidth);
	ctx.fillRect(tileRight - armWidth, tile.tileY - armLength, armWidth, armLength);

	// Bottom-left: horizontal arm extends LEFT, vertical arm extends DOWN
	ctx.fillRect(tile.tileX - armLength, tileBottom - armWidth, armLength, armWidth);
	ctx.fillRect(tile.tileX, tileBottom, armWidth, armLength);

	// Bottom-right: horizontal arm extends RIGHT, vertical arm extends DOWN
	ctx.fillRect(tileRight, tileBottom - armWidth, armLength, armWidth);
	ctx.fillRect(tileRight - armWidth, tileBottom, armWidth, armLength);
}

/**
 * Render a complete print sheet with 4 tiled passport photos and cut marks.
 * Returns a JPEG blob with 300 DPI metadata.
 */
export async function renderPrintSheet(
	img: HTMLImageElement,
	crop: CropState,
	layout: SheetLayout,
): Promise<Blob> {
	// Create sheet canvas with white background
	const sheetCanvas = document.createElement('canvas');
	sheetCanvas.width = layout.sheetWidthPx;
	sheetCanvas.height = layout.sheetHeightPx;
	const sheetCtx = sheetCanvas.getContext('2d');
	if (!sheetCtx) throw new Error('Could not create canvas context');
	sheetCtx.fillStyle = '#ffffff';
	sheetCtx.fillRect(0, 0, layout.sheetWidthPx, layout.sheetHeightPx);

	// Render crop to temp canvas at tile size (36x46mm) so buffer zones have image
	const photoW = layout.tiles[0].photoWidthPx;
	const photoH = layout.tiles[0].photoHeightPx;
	const tileW = Math.round(TILE_WIDTH_MM * layout.pxPerMm);
	const tileH = Math.round(TILE_HEIGHT_MM * layout.pxPerMm);
	const tempCanvas = document.createElement('canvas');
	tempCanvas.width = tileW;
	tempCanvas.height = tileH;
	const tempCtx = tempCanvas.getContext('2d');
	if (!tempCtx) throw new Error('Could not create canvas context');
	tempCtx.imageSmoothingQuality = 'high';

	const baseRect = calculateSourceRect(
		crop,
		img.naturalWidth,
		img.naturalHeight,
		photoW,
		photoH,
	);
	const { sx, sy, sw, sh } = expandSourceRect(
		baseRect,
		PHOTO_WIDTH_MM,
		PHOTO_HEIGHT_MM,
		INSET_MM,
	);
	tempCtx.drawImage(img, sx, sy, sw, sh, 0, 0, tileW, tileH);

	// Draw temp canvas at each tile position (fills entire tile including buffer)
	for (const tile of layout.tiles) {
		sheetCtx.drawImage(tempCanvas, tile.tileX, tile.tileY, tileW, tileH);
	}

	// Draw cut marks for all tiles
	for (const tile of layout.tiles) {
		drawCutMarks(sheetCtx, tile, layout.pxPerMm);
	}

	// Text styling
	const fontSize = Math.round(2.5 * layout.pxPerMm);
	const lineHeight = fontSize * 1.5;
	sheetCtx.font = `${fontSize}px sans-serif`;
	sheetCtx.fillStyle = '#888888';
	sheetCtx.textAlign = 'center';
	const cx = layout.sheetWidthPx / 2;

	// Top instruction (larger, higher)
	const headerFontSize = Math.round(3.5 * layout.pxPerMm);
	const firstTile = layout.tiles[0];
	const topTextY = firstTile.tileY - 7 * layout.pxPerMm;
	sheetCtx.font = `${headerFontSize}px sans-serif`;
	sheetCtx.fillText('Print this sheet at 9\u00d713cm on glossy photo paper', cx, topTextY);
	sheetCtx.font = `${fontSize}px sans-serif`;

	// Bottom instructions
	const lastTile = layout.tiles[layout.tiles.length - 1];
	const botTextY = lastTile.tileY + tileH + 8 * layout.pxPerMm;
	sheetCtx.fillText('Each tile is 36\u00d746mm with 0.5mm cutting buffer.', cx, botTextY);
	sheetCtx.fillText('Grey guides mark the 0.5mm buffer zones.', cx, botTextY + lineHeight);

	// Export as JPEG quality 1.0
	const blob = await new Promise<Blob>((resolve, reject) =>
		sheetCanvas.toBlob(
			(b) => (b ? resolve(b) : reject(new Error('Print sheet export failed'))),
			'image/jpeg',
			1.0,
		),
	);

	// Apply 300 DPI metadata
	return changeDpiBlob(blob, 300);
}
