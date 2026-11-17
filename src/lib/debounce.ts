export interface TimerHost {
	setTimeout: (callback: () => void, delayMs: number) => ReturnType<typeof globalThis.setTimeout>;
	clearTimeout: (timerId: ReturnType<typeof globalThis.setTimeout>) => void;
}

export interface DebouncedTask {
	schedule: () => void;
	flush: () => boolean;
	cancel: () => void;
	isPending: () => boolean;
}

export function createDebouncedTask(
	task: () => void,
	delayMs = 250,
	timers: TimerHost = globalThis,
): DebouncedTask {
	let timerId: ReturnType<typeof globalThis.setTimeout> | null = null;

	const cancel = (): void => {
		if (timerId !== null) {
			timers.clearTimeout(timerId);
			timerId = null;
		}
	};

	const schedule = (): void => {
		cancel();
		timerId = timers.setTimeout(() => {
			timerId = null;
			task();
		}, delayMs);
	};

	const flush = (): boolean => {
		if (timerId === null) {
			return false;
		}
		cancel();
		task();
		return true;
	};

	const isPending = (): boolean => timerId !== null;

	return {
		schedule,
		flush,
		cancel,
		isPending,
	};
}
