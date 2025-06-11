export const debounce = <T extends (...args: unknown[]) => unknown>(
	func: T,
	delay: number,
): ((...args: Parameters<T>) => void) => {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	return (...args: Parameters<T>) => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			func(...args);
		}, delay);
	};
};
