import { test, expect } from '@playwright/test';
import { resolve, join } from 'path';
import { mkdirSync } from 'fs';

const TEST_IMAGE = resolve('e2e/fixtures/test-photo.jpg');

test.describe('PassPhoto', () => {
	test('landing page loads with title and file picker', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toContainText('passport photo cropping tool');
		await expect(page.locator('input[type="file"]')).toBeAttached();
	});

	test('loads a photo and displays crop frame with 35:45 aspect ratio', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const cropFrame = page.locator('.crop-frame');
		await expect(cropFrame).toBeVisible({ timeout: 5000 });

		// Verify 35:45 aspect ratio (width/height ~= 0.778)
		const box = await cropFrame.boundingBox();
		expect(box).toBeTruthy();
		const ratio = box!.width / box!.height;
		expect(ratio).toBeCloseTo(35 / 45, 1);
	});

	test('crop workspace darkens area outside crop frame', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		// The crop-workspace has a dark background around the crop frame
		const workspace = page.locator('.crop-workspace');
		await expect(workspace).toBeVisible({ timeout: 5000 });

		const bg = await workspace.evaluate((el) => getComputedStyle(el).backgroundColor);
		// Should be a dark background
		const match = bg.match(/\d+/g)!.map(Number);
		expect(match[0]).toBeLessThan(40); // R
		expect(match[1]).toBeLessThan(40); // G
		expect(match[2]).toBeLessThan(40); // B
	});

	test('guide bands and crown hint visible', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const crownBand = page.locator('.guide-band.crown');
		const chinBand = page.locator('.guide-band.chin');
		await expect(crownBand).toBeVisible({ timeout: 5000 });
		await expect(chinBand).toBeVisible();

		// Crown hint text (inside the crown band)
		const crownHint = page.locator('.crown .crown-hint');
		await expect(crownHint).toContainText('not hair');

		// Dimension annotations showing 32mm and 36mm
		const dims = page.locator('.dim-label');
		await expect(dims.nth(0)).toContainText('32mm');
		await expect(dims.nth(1)).toContainText('36mm');
	});

	test('pan via drag moves the image after zooming in', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const cropFrame = page.locator('.crop-frame');
		await expect(cropFrame).toBeVisible({ timeout: 5000 });

		const box = await cropFrame.boundingBox();
		const cx = box!.x + box!.width / 2;
		const cy = box!.y + box!.height / 2;

		// Zoom in first (scroll up) so there's room to pan
		await page.mouse.move(cx, cy);
		await page.mouse.wheel(0, -500);
		await page.waitForTimeout(100);

		const img = page.locator('.crop-frame img');
		const styleBefore = await img.getAttribute('style');

		// Now drag to pan
		await page.mouse.move(cx, cy);
		await page.mouse.down();
		await page.mouse.move(cx + 50, cy + 50, { steps: 5 });
		await page.mouse.up();

		const styleAfter = await img.getAttribute('style');
		expect(styleAfter).not.toBe(styleBefore);
	});

	test('zoom via scroll wheel changes image scale', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const cropFrame = page.locator('.crop-frame');
		await expect(cropFrame).toBeVisible({ timeout: 5000 });

		const img = page.locator('.crop-frame img');
		const styleBefore = await img.getAttribute('style');

		const box = await cropFrame.boundingBox();
		await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
		await page.mouse.wheel(0, -300);
		await page.waitForTimeout(100);

		const styleAfter = await img.getAttribute('style');
		expect(styleAfter).not.toBe(styleBefore);
	});

	test('export buttons appear after loading image', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const printBtn = page.locator('button.export-btn--print');
		const digitalBtn = page.locator('button', { hasText: /Download Digital/i });
		const sheetBtn = page.locator('button', { hasText: /Print Sheet/i });
		await expect(printBtn).toBeVisible({ timeout: 5000 });
		await expect(digitalBtn).toBeVisible();
		await expect(sheetBtn).toBeVisible();
		await expect(printBtn).toBeEnabled();
		await expect(digitalBtn).toBeEnabled();
		await expect(sheetBtn).toBeEnabled();
	});

	test('spec panel displays Australian passport requirements', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const specPanel = page.locator('.spec-panel');
		await expect(specPanel).toBeVisible({ timeout: 5000 });
		await expect(specPanel).toContainText('Australian Passport Photo');
		await expect(specPanel).toContainText('35\u201340mm');
		await expect(specPanel).toContainText('45\u201350mm');
		await expect(specPanel).toContainText('32');
		await expect(specPanel).toContainText('36');
	});

	test('child-specific notes visible in spec panel', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const childRules = page.locator('.child-rules');
		await expect(childRules).toBeVisible({ timeout: 5000 });
		await expect(childRules).toContainText('Under 3');
		await expect(childRules).toContainText('Mouth may be open');
	});

	test('responsive layout: two columns on desktop', async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 768 });
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const layout = page.locator('.app-layout');
		await expect(layout).toBeVisible({ timeout: 5000 });

		const style = await layout.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
		expect(style.split(' ').length).toBeGreaterThanOrEqual(2);
	});

	test('horizontal ruler visible with non-zero width', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const ruler = page.locator('.ruler-h');
		const viewport = page.viewportSize();
		if (viewport && viewport.width < 480) {
			// Mobile: ruler is hidden by CSS media query
			await expect(ruler).toBeHidden();
			return;
		}

		await expect(ruler).toBeVisible({ timeout: 5000 });

		const box = await ruler.boundingBox();
		expect(box).toBeTruthy();
		expect(box!.width).toBeGreaterThan(50);

		// Verify tick marks are present (elements have width:0, rendered via ::before)
		const majorTicks = ruler.locator('.htick.major');
		await expect(majorTicks.first()).toBeAttached();
		const tickCount = await majorTicks.count();
		expect(tickCount).toBeGreaterThanOrEqual(7); // 0, 5, 10, 15, 20, 25, 30, 35
	});

	test('export buttons visible without scrolling past crop frame', async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 768 });
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const printBtn = page.locator('button.export-btn--print');
		await expect(printBtn).toBeVisible({ timeout: 5000 });

		const btnBox = await printBtn.boundingBox();
		expect(btnBox).toBeTruthy();
		// Buttons should be within viewport height (no scroll needed)
		expect(btnBox!.y).toBeLessThan(768);
	});

	test('horizontal ruler aligns with crop frame edges', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const viewport = page.viewportSize();
		if (viewport && viewport.width < 480) {
			// Mobile: ruler hidden, nothing to align
			await expect(page.locator('.ruler-h')).toBeHidden();
			return;
		}

		const cropFrame = page.locator('.crop-frame');
		await expect(cropFrame).toBeVisible({ timeout: 5000 });

		const frameBox = await cropFrame.boundingBox();
		const rulerBox = await page.locator('.ruler-h').boundingBox();
		expect(frameBox).toBeTruthy();
		expect(rulerBox).toBeTruthy();

		// Horizontal ruler left edge must align with crop frame left edge (within 2px)
		expect(Math.abs(rulerBox!.x - frameBox!.x)).toBeLessThanOrEqual(2);
		// Horizontal ruler width must match crop frame width (within 2px)
		expect(Math.abs(rulerBox!.width - frameBox!.width)).toBeLessThanOrEqual(2);
	});

	test('vertical ruler aligns with crop frame top and bottom', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const cropFrame = page.locator('.crop-frame');
		await expect(cropFrame).toBeVisible({ timeout: 5000 });

		const frameBox = await cropFrame.boundingBox();
		const rulerBox = await page.locator('.ruler').boundingBox();
		expect(frameBox).toBeTruthy();
		expect(rulerBox).toBeTruthy();

		// Vertical ruler top must align with crop frame top (within 2px)
		expect(Math.abs(rulerBox!.y - frameBox!.y)).toBeLessThanOrEqual(2);
		// Vertical ruler height must match crop frame height (within 2px)
		expect(Math.abs(rulerBox!.height - frameBox!.height)).toBeLessThanOrEqual(2);
	});

	test('guide band edges align with corresponding ruler ticks', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const cropFrame = page.locator('.crop-frame');
		await expect(cropFrame).toBeVisible({ timeout: 5000 });

		const frameBox = await cropFrame.boundingBox();
		const rulerBox = await page.locator('.ruler').boundingBox();
		expect(frameBox).toBeTruthy();
		expect(rulerBox).toBeTruthy();

		// Crown band top (4mm) should align with 4mm ruler tick
		const crownBand = page.locator('.guide-band.crown');
		const crownBox = await crownBand.boundingBox();
		expect(crownBox).toBeTruthy();

		// The tick at 4mm in the ruler
		const tick4Y = rulerBox!.y + (4 / 45) * rulerBox!.height;
		// Crown band top edge should be at 4mm tick position (within 1px)
		expect(Math.abs(crownBox!.y - tick4Y)).toBeLessThanOrEqual(1);

		// Crown band bottom (7mm) should align with 7mm ruler tick
		const tick7Y = rulerBox!.y + (7 / 45) * rulerBox!.height;
		const crownBottom = crownBox!.y + crownBox!.height;
		expect(Math.abs(crownBottom - tick7Y)).toBeLessThanOrEqual(1);

		// Chin band top (39mm) should align with 39mm ruler tick
		const chinBand = page.locator('.guide-band.chin');
		const chinBox = await chinBand.boundingBox();
		expect(chinBox).toBeTruthy();

		const tick39Y = rulerBox!.y + (39 / 45) * rulerBox!.height;
		expect(Math.abs(chinBox!.y - tick39Y)).toBeLessThanOrEqual(1);
	});

	test('guide bands use pseudo-elements not CSS borders for edge lines', async ({ page }) => {
		// CSS borders with border-box render bottom edges 1px higher than tick marks
		// because borders draw inward while tick ::before draws downward from the same
		// position. getBoundingClientRect reports identical values for both, making this
		// invisible to positional tests. This structural test ensures the implementation
		// uses pseudo-elements (which render in the same direction as ticks).
		await page.goto('/');
		await page.locator('input[type="file"]').setInputFiles(TEST_IMAGE);
		const cropFrame = page.locator('.crop-frame');
		await expect(cropFrame).toBeVisible({ timeout: 5000 });

		const styles = await page.evaluate(() => {
			const crown = document.querySelector('.guide-band.crown');
			const chin = document.querySelector('.guide-band.chin');
			const cs = (el: Element) => window.getComputedStyle(el);
			const ps = (el: Element, p: string) => window.getComputedStyle(el, p);
			return {
				crownBorderTop: cs(crown).borderTopWidth,
				crownBorderBot: cs(crown).borderBottomWidth,
				chinBorderTop: cs(chin).borderTopWidth,
				chinBorderBot: cs(chin).borderBottomWidth,
				// Pseudo-elements must exist and be absolutely positioned
				crownBeforePos: ps(crown, '::before').position,
				crownAfterPos: ps(crown, '::after').position,
				chinBeforePos: ps(chin, '::before').position,
				chinAfterPos: ps(chin, '::after').position,
			};
		});

		// No CSS borders (they cause the rendering-direction mismatch)
		expect(styles.crownBorderTop).toBe('0px');
		expect(styles.crownBorderBot).toBe('0px');
		expect(styles.chinBorderTop).toBe('0px');
		expect(styles.chinBorderBot).toBe('0px');

		// Edge lines must be absolutely-positioned pseudo-elements
		expect(styles.crownBeforePos).toBe('absolute');
		expect(styles.crownAfterPos).toBe('absolute');
		expect(styles.chinBeforePos).toBe('absolute');
		expect(styles.chinAfterPos).toBe('absolute');
	});

	test('dimension brackets align with guide bands', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const cropFrame = page.locator('.crop-frame');
		await expect(cropFrame).toBeVisible({ timeout: 5000 });

		const frameBox = await cropFrame.boundingBox();
		// The 32mm inner bracket should span from crown bottom to chin top
		const innerDim = page.locator('.dim-inner');
		const innerBox = await innerDim.boundingBox();
		expect(innerBox).toBeTruthy();

		// Crown bottom = 7/45 of frame height from top
		// Chin top = 39/45 of frame height from top
		const expectedTop = frameBox!.y + (7 / 45) * frameBox!.height;
		const expectedBottom = frameBox!.y + (39 / 45) * frameBox!.height;
		const expectedHeight = expectedBottom - expectedTop;

		expect(Math.abs(innerBox!.y - expectedTop)).toBeLessThanOrEqual(3);
		expect(Math.abs(innerBox!.height - expectedHeight)).toBeLessThanOrEqual(3);
	});

	test('print sheet button visible after loading image', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const sheetBtn = page.locator('button', { hasText: /Print Sheet/i });
		await expect(sheetBtn).toBeVisible({ timeout: 5000 });
		await expect(sheetBtn).toBeEnabled();
	});

	test('print sheet preview modal opens on button click', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const sheetBtn = page.locator('button', { hasText: /Print Sheet/i });
		await expect(sheetBtn).toBeVisible({ timeout: 5000 });
		await sheetBtn.click();

		const dialog = page.locator('dialog[open]');
		await expect(dialog).toBeVisible({ timeout: 10000 });

		// Preview should contain an image
		const previewImg = dialog.locator('img');
		await expect(previewImg).toBeVisible();

		// Download and Cancel buttons present
		const downloadBtn = dialog.locator('button', { hasText: /Download/i });
		const cancelBtn = dialog.locator('button', { hasText: /Cancel/i });
		await expect(downloadBtn).toBeVisible();
		await expect(cancelBtn).toBeVisible();
	});

	test('print sheet preview closes on cancel', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const sheetBtn = page.locator('button', { hasText: /Print Sheet/i });
		await expect(sheetBtn).toBeVisible({ timeout: 5000 });
		await sheetBtn.click();

		const dialog = page.locator('dialog[open]');
		await expect(dialog).toBeVisible({ timeout: 10000 });

		const cancelBtn = dialog.locator('button', { hasText: /Cancel/i });
		await cancelBtn.click();

		await expect(dialog).not.toBeVisible();
	});

	test('print sheet preview closes on backdrop click', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const sheetBtn = page.locator('button', { hasText: /Print Sheet/i });
		await expect(sheetBtn).toBeVisible({ timeout: 5000 });
		await sheetBtn.click();

		const dialog = page.locator('dialog[open]');
		await expect(dialog).toBeVisible({ timeout: 10000 });

		// Click the top-left corner of the dialog element (backdrop area, outside content)
		await dialog.click({ position: { x: 1, y: 1 } });

		await expect(dialog).not.toBeVisible();
	});

	test('print sheet download triggers JPEG file', async ({ page }) => {
		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const sheetBtn = page.locator('button', { hasText: /Print Sheet/i });
		await expect(sheetBtn).toBeVisible({ timeout: 5000 });
		await sheetBtn.click();

		const dialog = page.locator('dialog[open]');
		await expect(dialog).toBeVisible({ timeout: 10000 });

		const downloadPromise = page.waitForEvent('download');
		const downloadBtn = dialog.locator('button', { hasText: /Download/i });
		await downloadBtn.click();

		const download = await downloadPromise;
		expect(download.suggestedFilename()).toMatch(/\.jpg$/);
	});

	test('full-page screenshot capture', async ({ page }) => {
		const screenshotDir = join(process.cwd(), 'e2e', 'screenshots');
		mkdirSync(screenshotDir, { recursive: true });

		await page.goto('/');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(TEST_IMAGE);

		const cropFrame = page.locator('.crop-frame');
		await expect(cropFrame).toBeVisible({ timeout: 5000 });

		await page.screenshot({
			fullPage: true,
			path: join(screenshotDir, 'full-page.png'),
		});

		// Screenshot of crop workspace area
		const workspace = page.locator('.crop-workspace');
		await workspace.screenshot({
			path: join(screenshotDir, 'crop-workspace.png'),
		});
	});
});
