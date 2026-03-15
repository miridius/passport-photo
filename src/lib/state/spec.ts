import type { GuidePosition } from '../types';

// Source: https://www.passports.gov.au/help/passport-photos
export const AU_PASSPORT_SPEC = {
	// Photo dimensions (mm) — ranges per official AU spec
	photoWidthMm: 35,
	photoHeightMm: 45,
	photoWidthMinMm: 35,
	photoWidthMaxMm: 40,
	photoHeightMinMm: 45,
	photoHeightMaxMm: 50,
	aspectRatio: 35 / 45,

	// Face size (chin to crown, mm)
	faceHeightMinMm: 32,
	faceHeightMaxMm: 36,

	// As fraction of photo height
	faceHeightMinFrac: 32 / 45,
	faceHeightMaxFrac: 36 / 45,

	// Export targets
	digitalExport: {
		widthPx: 1200,
		dpi: 300,
		format: 'jpeg' as const,
		quality: 1.0,
		minSizeBytes: 70 * 1024, // 70 KB
		maxSizeBytes: 3.5 * 1024 * 1024, // 3.5 MB
	},

	// Child-specific rules
	childRules: {
		under3: {
			mouthMayBeOpen: true,
			noToysOrObjects: true,
			noOtherPeopleVisible: true,
		},
		age3Plus: {
			sameAsAdult: true,
			noOtherPeopleVisible: true,
		},
	},
} as const;

// Print sheet layout for 9×13cm format (standard instant-print size, e.g. DM Sofortfoto kiosks)
const PRINT_PHOTO_W = 35;
const PRINT_PHOTO_H = 45;
const PRINT_INSET = 0.5;

export const PRINT_SHEET = {
	sheetWidthMm: 90,
	sheetHeightMm: 130,
	tileWidthMm: PRINT_PHOTO_W + 2 * PRINT_INSET, // 36
	tileHeightMm: PRINT_PHOTO_H + 2 * PRINT_INSET, // 46
	photoWidthMm: PRINT_PHOTO_W,
	photoHeightMm: PRINT_PHOTO_H,
	gapMm: 5,
	insetMm: PRINT_INSET,
	cols: 2,
	rows: 2,
	cutMark: {
		lengthMm: 2,
		color: '#333333',
	},
} as const;

// Guide band positions as fractions from TOP of 45mm photo frame.
// The guides define two spans:
//   close edges (crown bottom to chin top): 7 to 39 = 32mm (min face height)
//   far edges (crown top to chin bottom): 4 to 40 = 36mm (max face height)
// Positions are rounded to whole mm from approximate centering of
// 32-36mm face heights within the 45mm frame.

export const crownGuide: GuidePosition = {
	topFrac: 4 / 45, // 4mm from top
	bottomFrac: 7 / 45, // 7mm from top — 3mm band
};

export const chinGuide: GuidePosition = {
	topFrac: 39 / 45, // 39mm from top
	bottomFrac: 40 / 45, // 40mm from top — 1mm bar
};
