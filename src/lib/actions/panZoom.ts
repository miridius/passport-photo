/**
 * Svelte action for pointer-event-driven pan and zoom gestures.
 * Supports single-pointer drag (pan) and two-pointer pinch (zoom).
 * Also handles mouse wheel zoom.
 */

export interface PanZoomCallbacks {
	onPan: (dx: number, dy: number) => void;
	onZoom: (factor: number, centerX: number, centerY: number) => void;
}

interface PointerInfo {
	x: number;
	y: number;
}

/** Convert wheel delta to a zoom factor. Positive delta = zoom out (>1).
 *  Normal scroll = 5% per step (coarse). Shift+scroll = 1% per step (fine/precision).
 *  Uses deltaX as fallback — browsers convert shift+scroll from vertical to horizontal. */
export function wheelToZoomFactor(deltaY: number, shiftKey: boolean = false, deltaX: number = 0): number {
	const step = shiftKey ? 1.01 : 1.05;
	const delta = deltaY !== 0 ? deltaY : deltaX;
	if (delta === 0) return 1;
	return delta > 0 ? step : 1 / step;
}

/** Calculate pinch distance ratio between previous and current pointer positions. */
export function calculatePinchRatio(
	prev: PointerInfo[],
	curr: PointerInfo[],
): number {
	const prevDist = Math.hypot(prev[1].x - prev[0].x, prev[1].y - prev[0].y);
	const currDist = Math.hypot(curr[1].x - curr[0].x, curr[1].y - curr[0].y);

	if (prevDist === 0 || currDist === 0) return 1;

	// Ratio: prevDist / currDist. Fingers apart = currDist > prevDist = ratio < 1 = zoom in.
	return prevDist / currDist;
}

export function panZoom(node: HTMLElement, callbacks: PanZoomCallbacks) {
	const pointers = new Map<number, PointerInfo>();

	// Critical for mobile: prevent browser zoom/scroll on crop area
	node.style.touchAction = 'none';

	function onPointerDown(e: PointerEvent) {
		try { node.setPointerCapture(e.pointerId); } catch { return; }
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
	}

	function onPointerMove(e: PointerEvent) {
		if (!pointers.has(e.pointerId)) return;

		const prev = pointers.get(e.pointerId)!;

		if (pointers.size === 1) {
			// Single pointer: pan
			const dx = e.clientX - prev.x;
			const dy = e.clientY - prev.y;
			callbacks.onPan(dx, dy);
			pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		} else if (pointers.size === 2) {
			// Two pointers: pinch zoom
			const prevPositions = Array.from(pointers.values());
			pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
			const currPositions = Array.from(pointers.values());

			const ratio = calculatePinchRatio(prevPositions, currPositions);
			if (ratio !== 1) {
				// Center is midpoint of two pointers relative to node
				const rect = node.getBoundingClientRect();
				const ids = Array.from(pointers.keys());
				const p1 = pointers.get(ids[0])!;
				const p2 = pointers.get(ids[1])!;
				const centerX = (p1.x + p2.x) / 2 - rect.left;
				const centerY = (p1.y + p2.y) / 2 - rect.top;
				callbacks.onZoom(ratio, centerX, centerY);
			}
		}
	}

	function onPointerUp(e: PointerEvent) {
		pointers.delete(e.pointerId);
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		const factor = wheelToZoomFactor(e.deltaY, e.shiftKey, e.deltaX);
		callbacks.onZoom(factor, e.offsetX, e.offsetY);
	}

	node.addEventListener('pointerdown', onPointerDown);
	node.addEventListener('pointermove', onPointerMove);
	node.addEventListener('pointerup', onPointerUp);
	node.addEventListener('pointercancel', onPointerUp);
	node.addEventListener('wheel', onWheel, { passive: false });

	return {
		destroy() {
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('pointermove', onPointerMove);
			node.removeEventListener('pointerup', onPointerUp);
			node.removeEventListener('pointercancel', onPointerUp);
			node.removeEventListener('wheel', onWheel);
		},
	};
}
