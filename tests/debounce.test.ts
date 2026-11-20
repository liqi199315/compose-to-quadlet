import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDebouncedTask } from '../src/lib/debounce';

describe('createDebouncedTask', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('coalesces rapid schedule calls and executes once after 250ms', () => {
		const task = vi.fn();
		const debounced = createDebouncedTask(task, 250);

		debounced.schedule();
		vi.advanceTimersByTime(100);
		debounced.schedule();
		vi.advanceTimersByTime(100);
		debounced.schedule();

		expect(debounced.isPending()).toBe(true);
		expect(task).not.toHaveBeenCalled();

		vi.advanceTimersByTime(249);
		expect(task).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(task).toHaveBeenCalledTimes(1);
		expect(debounced.isPending()).toBe(false);
	});

	it('flushes a pending task synchronously and clears the timer so it does not fire twice', () => {
		const task = vi.fn();
		const debounced = createDebouncedTask(task, 250);

		debounced.schedule();
		expect(debounced.isPending()).toBe(true);

		const didFlush = debounced.flush();
		expect(didFlush).toBe(true);
		expect(task).toHaveBeenCalledTimes(1);
		expect(debounced.isPending()).toBe(false);

		vi.advanceTimersByTime(500);
		expect(task).toHaveBeenCalledTimes(1);
	});

	it('returns false on flush when no task is pending', () => {
		const task = vi.fn();
		const debounced = createDebouncedTask(task, 250);

		expect(debounced.flush()).toBe(false);
		expect(task).not.toHaveBeenCalled();
	});

	it('cancels a pending timer without running the task', () => {
		const task = vi.fn();
		const debounced = createDebouncedTask(task, 250);

		debounced.schedule();
		debounced.cancel();

		expect(debounced.isPending()).toBe(false);
		vi.advanceTimersByTime(500);
		expect(task).not.toHaveBeenCalled();
	});
});
