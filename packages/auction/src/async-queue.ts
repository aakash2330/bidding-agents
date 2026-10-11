/** Bounded async channel: push / take until close(). */
export type AsyncQueue<T> = {
	push: (value: T) => void;
	take: () => Promise<T | null>;
	close: () => void;
};

export function createAsyncQueue<T>(): AsyncQueue<T> {
	const buffer: T[] = [];
	let closed = false;
	let waiter: ((value: T | null) => void) | undefined;

	const push = (value: T) => {
		if (closed) return;
		if (waiter) {
			const resolve = waiter;
			waiter = undefined;
			resolve(value);
			return;
		}
		buffer.push(value);
	};

	const take = (): Promise<T | null> => {
		const next = buffer.shift();
		if (next !== undefined) return Promise.resolve(next);
		if (closed) return Promise.resolve(null);
		return new Promise((resolve) => {
			waiter = resolve;
		});
	};

	const close = () => {
		closed = true;
		waiter?.(null);
		waiter = undefined;
	};

	return { push, take, close };
}
