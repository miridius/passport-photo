import type { CropState, ImageState } from '$lib/types';
import { AU_PASSPORT_SPEC } from './spec';
import { DEFAULT_CROP, initialZoomFraction } from './crop';

export { DEFAULT_CROP, initialZoomFraction, applyPan, applyZoom } from './crop';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const DEFAULT_IMAGE: ImageState = {
	loaded: false,
	element: null,
	naturalWidth: 0,
	naturalHeight: 0,
	url: '',
};

// Dev-only: HMR state persistence — import.meta.hot.data survives hot module
// replacement but resets on full page reload, so dev can start fresh by refreshing.
interface HmrData {
	crop?: CropState;
	img?: { w: number; h: number; url: string; element: HTMLImageElement };
}
const _hmr = import.meta.hot?.data as HmrData | undefined;

// Reactive state (Svelte 5 runes)
export let cropState = $state<CropState>(_hmr?.crop ?? { ...DEFAULT_CROP });
export let imageState = $state<ImageState>(
	_hmr?.img
		? {
				loaded: true,
				element: _hmr.img.element,
				naturalWidth: _hmr.img.w,
				naturalHeight: _hmr.img.h,
				url: _hmr.img.url,
			}
		: { ...DEFAULT_IMAGE },
);

if (import.meta.hot) {
	import.meta.hot.dispose((data: HmrData) => {
		data.crop = {
			offsetX: cropState.offsetX,
			offsetY: cropState.offsetY,
			zoomFraction: cropState.zoomFraction,
		};
		if (imageState.loaded) {
			data.img = {
				w: imageState.naturalWidth,
				h: imageState.naturalHeight,
				url: imageState.url,
				element: imageState.element,
			};
		}
	});
}

/**
 * Load an image from a File, set up imageState and calculate initial crop.
 */
export async function loadImage(file: File): Promise<void> {
	if (file.size > MAX_FILE_SIZE) {
		throw new Error(`Image too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum is 50MB.`);
	}

	// Revoke previous object URL if any
	if (imageState.loaded && imageState.url.startsWith('blob:')) {
		URL.revokeObjectURL(imageState.url);
	}

	const url = URL.createObjectURL(file);

	const img = new Image();
	await new Promise<void>((resolve, reject) => {
		img.onload = () => resolve();
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('Failed to load image. The file may be in an unsupported format. Try converting to JPEG or PNG first.'));
		};
		img.src = url;
	});

	if (img.naturalWidth === 0 || img.naturalHeight === 0) {
		URL.revokeObjectURL(url);
		throw new Error('Image has invalid dimensions (0 width or height). The file may be corrupted.');
	}

	Object.assign(imageState, {
		loaded: true,
		element: img,
		naturalWidth: img.naturalWidth,
		naturalHeight: img.naturalHeight,
		url,
	});
	Object.assign(cropState, {
		zoomFraction: initialZoomFraction(img.naturalWidth, img.naturalHeight, AU_PASSPORT_SPEC.aspectRatio),
		offsetX: 0,
		offsetY: 0,
	});
}
