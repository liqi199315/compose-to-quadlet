export type AnalyticsParamValue = string | number | boolean;
export type AnalyticsParams = Record<string, AnalyticsParamValue>;

declare global {
	interface Window {
		dataLayer?: unknown[];
		gtag?: (...args: unknown[]) => void;
	}
}

const VALID_EVENT_NAME = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;
const VALID_PARAM_KEY = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;
const BLOCKED_PARAM_KEYS = new Set([
	'yaml',
	'raw_yaml',
	'compose_yaml',
	'yaml_content',
	'unit_content',
	'raw_command',
	'command_line',
	'env_content',
	'env_values',
	'secret',
	'secrets',
	'password',
	'token',
	'api_key',
]);
const SUSPICIOUS_VALUE_PATTERN =
	/[\r\n]|:\/\/|@|(?:^|\s)services\s*:|(?:password|secret|token|api[_-]?key|private[_-]?key)\s*[:=]/i;

function sanitizeParams(
	params: Record<string, AnalyticsParamValue>,
): Record<string, AnalyticsParamValue> {
	const clean: Record<string, AnalyticsParamValue> = {};

	for (const [rawKey, rawValue] of Object.entries(params)) {
		const key = rawKey.trim();
		if (!VALID_PARAM_KEY.test(key) || BLOCKED_PARAM_KEYS.has(key.toLowerCase())) {
			continue;
		}

		if (typeof rawValue === 'boolean') {
			clean[key] = rawValue;
			continue;
		}

		if (typeof rawValue === 'number') {
			if (Number.isFinite(rawValue)) {
				clean[key] = rawValue;
			}
			continue;
		}

		if (typeof rawValue === 'string') {
			const trimmed = rawValue.trim();
			if (!trimmed || trimmed.length > 100 || SUSPICIOUS_VALUE_PATTERN.test(trimmed)) {
				continue;
			}
			clean[key] = trimmed;
		}
	}

	return clean;
}

export function trackToolEvent(
	eventName: string,
	params?: Record<string, string | number | boolean>,
): void {
	if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
		return;
	}

	const trimmedEvent = eventName.trim();
	if (!VALID_EVENT_NAME.test(trimmedEvent)) {
		return;
	}

	if (params === undefined) {
		window.gtag('event', trimmedEvent);
		return;
	}

	window.gtag('event', trimmedEvent, sanitizeParams(params));
}
