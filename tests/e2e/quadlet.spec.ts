import { expect, type Locator, test } from '@playwright/test';

async function readOutputText(locator: Locator): Promise<string> {
	return locator.evaluate((el) => {
		if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
			return el.value;
		}
		return el.textContent ?? '';
	});
}

function isLocalRequest(rawUrl: string): boolean {
	return (
		rawUrl.startsWith('http://127.0.0.1') ||
		rawUrl.startsWith('http://localhost') ||
		rawUrl.startsWith('blob:http://127.0.0.1') ||
		rawUrl.startsWith('blob:http://localhost') ||
		rawUrl.startsWith('data:')
	);
}

test.describe('Compose to Quadlet converter journeys', () => {
	test('loads / with valid quadlet units, toggles selinux volume mode, and makes zero external requests', async ({
		page,
	}) => {
		const externalRequests: string[] = [];
		page.on('request', (request) => {
			const url = request.url();
			if (!url.startsWith('http://127.0.0.1:4327') && !url.startsWith('http://localhost:4327')) {
				externalRequests.push(url);
			}
		});

		await page.goto('/');

		const statusBanner = page.getByTestId('status-banner');
		const unitOutput = page.getByTestId('unit-output');

		await expect(statusBanner).toHaveAttribute('data-status', 'ok');
		await expect.poll(() => readOutputText(unitOutput)).toContain('[Container]');
		await expect.poll(() => readOutputText(unitOutput)).toContain('.network');

		await page.getByTestId('selinux-select').selectOption('private-Z');
		await expect.poll(() => readOutputText(unitOutput)).toContain(':Z');

		expect(externalRequests).toEqual([]);
	});

	test('loads /docker-run-to-quadlet-converter/ and generates container unit with PublishPort and systemd commands', async ({
		page,
	}) => {
		await page.goto('/docker-run-to-quadlet-converter/');

		const statusBanner = page.getByTestId('status-banner');
		const unitOutput = page.getByTestId('unit-output');
		const systemdBox = page.getByTestId('systemd-commands-box');

		await expect(statusBanner).toHaveAttribute('data-status', 'ok');
		await expect.poll(() => readOutputText(unitOutput)).toContain('[Container]');
		await expect.poll(() => readOutputText(unitOutput)).toContain('PublishPort=');
		await expect.poll(() => readOutputText(systemdBox)).toContain('systemctl --user daemon-reload');
	});

	test('clicking download-zip-btn triggers real zip download with PKZIP magic and container unit text', async ({
		page,
	}) => {
		await page.goto('/');
		await expect(page.getByTestId('status-banner')).toHaveAttribute('data-status', 'ok');

		const downloadPromise = page.waitForEvent('download');
		await page.getByTestId('download-zip-btn').click();
		const download = await downloadPromise;

		expect(download.suggestedFilename()).toMatch(/\.zip$/i);
		const stream = await download.createReadStream();
		expect(stream).not.toBeNull();

		const chunks: Buffer[] = [];
		for await (const chunk of stream!) {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		}
		const zipBuffer = Buffer.concat(chunks);
		expect(zipBuffer.byteLength).toBeGreaterThan(20);

		expect(zipBuffer[0]).toBe(0x50);
		expect(zipBuffer[1]).toBe(0x4b);
		expect(zipBuffer[2]).toBe(0x03);
		expect(zipBuffer[3]).toBe(0x04);

		const zipText = zipBuffer.toString('utf8');
		expect(zipText).toContain('[Container]');
	});

	test('surfaces error banner on invalid YAML and recovers cleanly on load-template-btn', async ({
		page,
	}) => {
		await page.goto('/');

		const statusBanner = page.getByTestId('status-banner');
		const composeInput = page.getByTestId('compose-input');
		const unitOutput = page.getByTestId('unit-output');

		await expect(statusBanner).toHaveAttribute('data-status', 'ok');

		await composeInput.fill('services: [unclosed');
		await expect(statusBanner).toHaveAttribute('data-status', 'error');

		const errorText = ((await statusBanner.textContent()) ?? '').trim();
		expect(errorText.length).toBeGreaterThan(0);

		await page.getByTestId('load-template-btn').click();
		await expect(statusBanner).toHaveAttribute('data-status', 'ok');
		await expect.poll(() => readOutputText(unitOutput)).toContain('[Container]');
	});

	test('records GA4 config and quadlet_export in window.dataLayer with zero external network requests', async ({
		page,
	}) => {
		const externalRequests: string[] = [];
		page.on('request', (request) => {
			const url = request.url();
			if (!isLocalRequest(url)) {
				externalRequests.push(url);
			}
		});

		await page.goto('/');
		await expect(page.getByTestId('status-banner')).toHaveAttribute('data-status', 'ok');

		const downloadPromise = page.waitForEvent('download');
		await page.getByTestId('download-zip-btn').click();
		await downloadPromise;

		const dataLayerEntries = await page.evaluate(() => {
			const raw = (window as Window & { dataLayer?: unknown[] }).dataLayer ?? [];
			return raw.map((entry) => {
				if (Array.isArray(entry)) {
					return entry;
				}
				if (entry && typeof entry === 'object' && 'length' in entry) {
					return Array.from(entry as ArrayLike<unknown>);
				}
				return entry;
			});
		});

		const hasConfig = dataLayerEntries.some((entry) => {
			if (Array.isArray(entry)) {
				return entry[0] === 'config';
			}
			return Boolean(
				entry && typeof entry === 'object' && (entry as Record<string, unknown>).event === 'config',
			);
		});

		const hasQuadletExport = dataLayerEntries.some((entry) => {
			if (Array.isArray(entry)) {
				return entry[0] === 'event' && entry[1] === 'quadlet_export';
			}
			return Boolean(
				entry &&
					typeof entry === 'object' &&
					(entry as Record<string, unknown>).event === 'quadlet_export',
			);
		});

		expect(hasConfig).toBe(true);
		expect(hasQuadletExport).toBe(true);
		expect(externalRequests).toHaveLength(0);
	});

	test('renders cleanly at 375x812 mobile viewport and navigates via footer to /privacy/ and /about/', async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 812 });

		const homeResponse = await page.goto('/');
		expect(homeResponse?.status()).toBe(200);
		await expect(page.getByTestId('status-banner')).toHaveAttribute('data-status', 'ok');

		const homeScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		expect(homeScrollWidth).toBeLessThanOrEqual(375);

		const privacyLink = page.locator('footer a[href="/privacy/"]').first();
		await expect(privacyLink).toBeVisible();
		const [privacyResponse] = await Promise.all([
			page.waitForResponse((res) => new URL(res.url()).pathname === '/privacy/'),
			privacyLink.click(),
		]);
		expect(privacyResponse.status()).toBe(200);
		await expect(page).toHaveURL(/\/privacy\/$/);
		await expect(page.locator('h1')).toBeVisible();

		const privacyScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		expect(privacyScrollWidth).toBeLessThanOrEqual(375);

		const aboutLink = page.locator('footer a[href="/about/"]').first();
		await expect(aboutLink).toBeVisible();
		const [aboutResponse] = await Promise.all([
			page.waitForResponse((res) => new URL(res.url()).pathname === '/about/'),
			aboutLink.click(),
		]);
		expect(aboutResponse.status()).toBe(200);
		await expect(page).toHaveURL(/\/about\/$/);
		await expect(page.locator('h1')).toBeVisible();

		const aboutScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		expect(aboutScrollWidth).toBeLessThanOrEqual(375);
	});

	test('long-tail guides render a working converter and can export', async ({ page }) => {
		const routes: { path: string; output: string }[] = [
			{ path: '/quadlet-depends-on-healthcheck/', output: 'Notify=healthy' },
			{ path: '/quadlet-not-starting-on-boot/', output: 'WantedBy=default.target' },
			{ path: '/podman-pihole-quadlet/', output: 'PublishPort=53:53/udp' },
			{ path: '/jellyfin-podman-quadlet/', output: 'AddDevice=/dev/dri:/dev/dri' },
			{ path: '/quadlet-vs-docker-compose/', output: 'Network=edge.network' },
		];

		for (const route of routes) {
			const response = await page.goto(route.path);
			expect(response?.status()).toBe(200);
			await expect(page.locator('h1')).toBeVisible();
			await expect(page.getByText('quadletgen.com').first()).toBeVisible();
			await expect(page.getByTestId('status-banner')).toHaveAttribute('data-status', 'ok');
			await expect.poll(() => readOutputText(page.getByTestId('unit-output'))).toContain(route.output);
		}

		await page.goto('/quadlet-depends-on-healthcheck/');
		await expect(page.getByTestId('status-banner')).toHaveAttribute('data-status', 'ok');
		const downloadPromise = page.waitForEvent('download');
		await page.getByTestId('download-zip-btn').click();
		await downloadPromise;
		const dataLayerEntries = await page.evaluate(() => {
			const raw = (window as Window & { dataLayer?: unknown[] }).dataLayer ?? [];
			return raw.map((entry) => {
				if (Array.isArray(entry)) {
					return entry;
				}
				if (entry && typeof entry === 'object' && 'length' in entry) {
					return Array.from(entry as ArrayLike<unknown>);
				}
				return entry;
			});
		});
		const hasQuadletExport = dataLayerEntries.some((entry) => {
			if (Array.isArray(entry)) {
				return entry[0] === 'event' && entry[1] === 'quadlet_export';
			}
			return Boolean(
				entry &&
					typeof entry === 'object' &&
					(entry as Record<string, unknown>).event === 'quadlet_export',
			);
		});
		expect(hasQuadletExport).toBe(true);

		const healthLink = page.locator('main a[href="/quadlet-depends-on-healthcheck/"]');
		await page.goto('/quadlet-vs-docker-compose/');
		await expect(healthLink.first()).toBeVisible();

		await page.setViewportSize({ width: 375, height: 812 });
		for (const route of routes) {
			await page.goto(route.path);
			await expect(page.getByTestId('status-banner')).toHaveAttribute('data-status', 'ok');
			const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
			expect(scrollWidth).toBeLessThanOrEqual(375);
		}
	});
});
