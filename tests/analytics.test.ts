import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	INTERNAL_TRAFFIC_BOOTSTRAP,
	INTERNAL_TRAFFIC_STORAGE_KEY,
} from '../src/lib/internal-traffic';

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

describe('internal traffic flag', () => {
	function runBootstrap(options: {
		search: string;
		hash?: string;
		stored?: string;
		getItemThrows?: boolean;
		setItemThrows?: boolean;
	}) {
		const store = new Map<string, string>();
		if (options.stored !== undefined) {
			store.set(INTERNAL_TRAFFIC_STORAGE_KEY, options.stored);
		}

		const localStorageStub = {
			getItem: vi.fn((key: string) => {
				if (options.getItemThrows) {
					throw new Error('storage blocked');
				}
				return store.get(key) ?? null;
			}),
			setItem: vi.fn((key: string, value: string) => {
				if (options.setItemThrows) {
					throw new Error('storage blocked');
				}
				store.set(key, value);
			}),
			removeItem: vi.fn((key: string) => {
				store.delete(key);
			}),
		};
		const replaceState = vi.fn();
		const locationStub = {
			pathname: '/',
			search: options.search,
			hash: options.hash ?? '',
		};
		const historyStub = { state: null, replaceState };
		const windowStub: Record<string, unknown> = {};

		const run = new Function(
			'window',
			'location',
			'history',
			'localStorage',
			INTERNAL_TRAFFIC_BOOTSTRAP,
		);
		run(windowStub, locationStub, historyStub, localStorageStub);

		return { windowStub, replaceState, store };
	}

	it('stores the flag and leaves a clean URL for ?internal=1', () => {
		const { windowStub, replaceState, store } = runBootstrap({ search: '?internal=1' });

		expect(windowStub.__qgInternalTraffic).toBe(true);
		expect(store.get(INTERNAL_TRAFFIC_STORAGE_KEY)).toBe('1');
		expect(replaceState).toHaveBeenCalledWith(null, '', '/');
	});

	it('removes only the internal param and keeps other query params', () => {
		const { replaceState } = runBootstrap({
			search: '?internal=1&utm_source=test',
			hash: '#top',
		});

		expect(replaceState).toHaveBeenCalledWith(null, '', '/?utm_source=test#top');
	});

	it('clears the flag for ?internal=0', () => {
		const { windowStub, replaceState, store } = runBootstrap({
			search: '?internal=0',
			stored: '1',
		});

		expect(windowStub.__qgInternalTraffic).toBe(false);
		expect(store.has(INTERNAL_TRAFFIC_STORAGE_KEY)).toBe(false);
		expect(replaceState).toHaveBeenCalledWith(null, '', '/');
	});

	it('keeps an existing flag without touching the URL', () => {
		const { windowStub, replaceState } = runBootstrap({ search: '', stored: '1' });

		expect(windowStub.__qgInternalTraffic).toBe(true);
		expect(replaceState).not.toHaveBeenCalled();
	});

	it('degrades silently when storage access throws', () => {
		const { windowStub, replaceState, store } = runBootstrap({
			search: '?internal=1',
			getItemThrows: true,
			setItemThrows: true,
		});

		expect(windowStub.__qgInternalTraffic).toBe(false);
		expect(store.size).toBe(0);
		expect(replaceState).toHaveBeenCalledWith(null, '', '/');
	});
});

describe('internal traffic event params', () => {
	it('does not add traffic_type when the flag is absent', () => {
		const gtag = vi.fn();
		vi.stubGlobal('window', { gtag, localStorage: { getItem: vi.fn(() => null) } });

		trackToolEvent('quadlet_export', { action: 'zip', unit_count: 1 });

		const sentParams = gtag.mock.calls[0]?.[2] as Record<string, unknown>;
		expect(sentParams).not.toHaveProperty('traffic_type');
	});

	it('adds traffic_type internal when the flag is present', () => {
		const gtag = vi.fn();
		vi.stubGlobal('window', { gtag, localStorage: { getItem: vi.fn(() => '1') } });

		trackToolEvent('quadlet_export', { action: 'zip', unit_count: 1 });

		expect(gtag).toHaveBeenCalledWith('event', 'quadlet_export', {
			action: 'zip',
			unit_count: 1,
			traffic_type: 'internal',
		});
	});

	it('degrades silently when localStorage throws', () => {
		const gtag = vi.fn();
		const windowStub = { gtag };
		Object.defineProperty(windowStub, 'localStorage', {
			get() {
				throw new Error('storage blocked');
			},
		});
		vi.stubGlobal('window', windowStub);

		expect(() => trackToolEvent('quadlet_export', { action: 'copy' })).not.toThrow();
		expect(gtag).toHaveBeenCalledWith('event', 'quadlet_export', { action: 'copy' });
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
