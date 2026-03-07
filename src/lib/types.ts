export interface CropState {
	offsetX: number; // [0, 1 - zoomFraction], fraction of source image width at crop frame left edge
	offsetY: number; // [0, 1 - zoomFraction * yScale], fraction of source image height at crop frame top edge
	zoomFraction: number; // [0.01, 1.0], fraction of source image width that fills crop frame width
}

export interface ImageState {
	element: HTMLImageElement | null;
	naturalWidth: number;
	naturalHeight: number;
	url: string;
}

export interface ExportTarget {
	widthPx: number;
	heightPx: number;
	dpi: number;
	format: 'png' | 'jpeg';
	quality?: number;
}

export interface GuidePosition {
	topFrac: number; // fraction from top of crop frame
	bottomFrac: number; // fraction from top of crop frame
}
