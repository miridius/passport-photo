import type { CropState, ImageState } from '$lib/types';
import { AU_PASSPORT_SPEC } from './spec';
import { DEFAULT_CROP, initialZoomFraction } from './crop';

export { DEFAULT_CROP, initialZoomFraction, applyPan, applyZoom } from './crop';

const DEFAULT_IMAGE: ImageState = {
	element: null,
	naturalWidth: 0,
	naturalHeight: 0,
	url: '',
};

// Dev-only: HMR state persistence — import.meta.hot.data survives hot module
// replacement but not full page reloads (which is the desired behavior).
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
		if (imageState.element) {
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
	const dataUrl = await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(new Error('Failed to read image file'));
		reader.readAsDataURL(file);
	});

	const img = new Image();
	await new Promise<void>((resolve, reject) => {
		img.onload = () => resolve();
		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = dataUrl;
	});

	imageState.element = img;
	imageState.naturalWidth = img.naturalWidth;
	imageState.naturalHeight = img.naturalHeight;
	imageState.url = dataUrl;

	cropState.zoomFraction = initialZoomFraction(img.naturalWidth, img.naturalHeight, AU_PASSPORT_SPEC.aspectRatio);
	cropState.offsetX = 0;
	cropState.offsetY = 0;
}
