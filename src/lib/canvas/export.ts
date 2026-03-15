import { changeDpiBlob } from 'changedpi';
import type { CropState, ExportTarget } from '../types';

export interface SourceRect {
	sx: number;
	sy: number;
	sw: number;
	sh: number;
}

/**
 * Calculate the source rectangle in image pixels for a given crop and target.
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

const SUPPORTED_DPI_TYPES = new Set(['image/jpeg', 'image/png']);
const DPI_TIMEOUT_MS = 10_000;

/**
 * Apply DPI metadata to a blob with type validation and timeout protection.
 * `changeDpiBlob` silently returns the original blob for unsupported types.
 */
export async function safeDpiBlob(blob: Blob, dpi: number): Promise<Blob> {
	if (!SUPPORTED_DPI_TYPES.has(blob.type)) {
		throw new Error(`Cannot set DPI on unsupported blob type: ${blob.type}`);
	}
	const result = changeDpiBlob(blob, dpi);
	if (result instanceof Promise) {
		return Promise.race([
			result,
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error('DPI metadata injection timed out')), DPI_TIMEOUT_MS),
			),
		]);
	}
	return result;
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

	return safeDpiBlob(blob, target.dpi);
}

export interface DigitalExportSpec {
	minSizeBytes: number;
	maxSizeBytes: number;
	quality: number;
}

/**
 * Digital export with binary search quality auto-adjust.
 * Starts at max quality. If blob > maxSize, binary search reduces quality.
 * If blob < minSize at max quality, source is too small — returns error.
 */
export async function exportDigitalWithQualitySearch(
	img: HTMLImageElement,
	crop: CropState,
	widthPx: number,
	heightPx: number,
	spec: DigitalExportSpec,
): Promise<{ blob: Blob } | { error: string }> {
	const baseTarget: ExportTarget = { widthPx, heightPx, dpi: 300, format: 'jpeg', quality: spec.quality };
	const blob = await exportCrop(img, crop, baseTarget);

	if (blob.size < spec.minSizeBytes) {
		return { error: `Source image too small for digital submission (minimum ${Math.round(spec.minSizeBytes / 1024)}KB required). Try a higher-resolution photo.` };
	}

	if (blob.size <= spec.maxSizeBytes) {
		return { blob };
	}

	// Too large — binary search on quality
	let lo = 0.5;
	let hi = 1.0;
	let validBlob: Blob | null = null;

	for (let i = 0; i < 8; i++) {
		const mid = (lo + hi) / 2;
		const target: ExportTarget = { widthPx, heightPx, dpi: 300, format: 'jpeg', quality: mid };
		const attempt = await exportCrop(img, crop, target);

		if (attempt.size > spec.maxSizeBytes) {
			hi = mid;
		} else {
			lo = mid;
			validBlob = attempt;
		}
	}

	if (validBlob) {
		return { blob: validBlob };
	}
	return { error: `Could not compress to under ${spec.maxSizeBytes / (1024 * 1024)}MB. Try cropping tighter.` };
}

/**
 * Trigger a browser download of a Blob with the given filename.
 */
export function triggerDownload(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	try {
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	} catch (e) {
		URL.revokeObjectURL(url);
		throw e;
	}
	// Delay revocation so the browser has time to start the download
	setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
