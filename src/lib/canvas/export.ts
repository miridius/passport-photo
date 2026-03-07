import { changeDpiBlob } from 'changedpi';
import type { CropState, ExportTarget } from '$lib/types';

export interface SourceRect {
	sx: number;
	sy: number;
	sw: number;
	sh: number;
}

/**
 * Calculate the source rectangle in image pixels for a given crop and target.
 * Pure function — no DOM dependency, fully testable.
 */
export function calculateSourceRect(
	crop: CropState,
	naturalWidth: number,
	naturalHeight: number,
	targetWidth: number,
	targetHeight: number,
): SourceRect {
	const sx = crop.offsetX * naturalWidth;
	const sy = crop.offsetY * naturalHeight;
	const sw = crop.zoomFraction * naturalWidth;
	const sh = sw * (targetHeight / targetWidth);
	return { sx, sy, sw, sh };
}

/**
 * Export the crop region from a source image onto an off-screen canvas
 * at the specified target dimensions, then apply DPI metadata.
 */
export async function exportCrop(
	img: HTMLImageElement,
	crop: CropState,
	target: ExportTarget,
): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = target.widthPx;
	canvas.height = target.heightPx;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Could not create canvas context');
	ctx.imageSmoothingQuality = 'high';

	const { sx, sy, sw, sh } = calculateSourceRect(
		crop,
		img.naturalWidth,
		img.naturalHeight,
		target.widthPx,
		target.heightPx,
	);

	ctx.drawImage(img, sx, sy, sw, sh, 0, 0, target.widthPx, target.heightPx);

	const mimeType = target.format === 'png' ? 'image/png' : 'image/jpeg';
	const quality = target.format === 'jpeg' ? (target.quality ?? 1.0) : undefined;

	const blob = await new Promise<Blob>((resolve, reject) =>
		canvas.toBlob(
			(b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
			mimeType,
			quality,
		),
	);

	return changeDpiBlob(blob, target.dpi);
}

/**
 * Trigger a browser download of a Blob with the given filename.
 */
export function triggerDownload(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
