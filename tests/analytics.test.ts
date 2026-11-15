import { beforeEach, describe, expect, it, vi } from 'vitest';

type AnalyticsModule = typeof import('../src/lib/analytics');

let trackToolEvent: AnalyticsModule['trackToolEvent'];
let trackQuadletConverted: AnalyticsModule['trackQuadletConverted'];

beforeEach(async () => {
	vi.resetModules();
	vi.unstubAllGlobals();
	const analytics = await import('../src/lib/analytics');
	trackToolEvent = analytics.trackToolEvent;
	trackQuadletConverted = analytics.trackQuadletConverted;
});

describe('trackToolEvent', () => {
	it('sends events through window.gtag when it is a function', () => {
		const gtag = vi.fn();
		vi.stubGlobal('window', { gtag });

		trackToolEvent('quadlet_export', { action: 'copy', unit_count: 2 });

		expect(gtag).toHaveBeenCalledTimes(1);
		expect(gtag).toHaveBeenCalledWith('event', 'quadlet_export', {
			action: 'copy',
			unit_count: 2,
		});
	});

	it('does nothing when gtag is missing', () => {
		vi.stubGlobal('window', {});

		expect(() => trackToolEvent('quadlet_export', { action: 'zip' })).not.toThrow();
	});
});

describe('trackQuadletConverted', () => {
	it('sends quadlet_converted with unit_count once per page load', () => {
		const gtag = vi.fn();
		vi.stubGlobal('window', { gtag });

		trackQuadletConverted(3);
		trackQuadletConverted(5);

		expect(gtag).toHaveBeenCalledTimes(1);
		expect(gtag).toHaveBeenCalledWith('event', 'quadlet_converted', { unit_count: 3 });
	});

	it('does not send the event for a failed conversion', () => {
		const gtag = vi.fn();
		vi.stubGlobal('window', { gtag });

		trackQuadletConverted(null);
		trackQuadletConverted(2);

		expect(gtag).toHaveBeenCalledTimes(1);
		expect(gtag).toHaveBeenCalledWith('event', 'quadlet_converted', { unit_count: 2 });
	});

	it('does not send the event when no unit files were produced', () => {
		const gtag = vi.fn();
		vi.stubGlobal('window', { gtag });

		trackQuadletConverted(0);
		trackQuadletConverted(1);

		expect(gtag).toHaveBeenCalledTimes(1);
		expect(gtag).toHaveBeenCalledWith('event', 'quadlet_converted', { unit_count: 1 });
	});

	it('does nothing when gtag is missing and still counts the first success', () => {
		vi.stubGlobal('window', {});

		expect(() => trackQuadletConverted(1)).not.toThrow();

		const gtag = vi.fn();
		vi.stubGlobal('window', { gtag });
		trackQuadletConverted(4);

		expect(gtag).not.toHaveBeenCalled();
	});
});
