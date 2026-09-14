import { forwardRef, type HTMLAttributes } from 'react';

export const SfuGridLayoutContainer = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function SfuGridLayoutContainer(
	{ children, className = '', ...props },
	ref
) {
	return (
		<main ref={ref} className={`relative flex min-h-0 flex-1 flex-col overflow-hidden p-4 pb-16 ${className}`} {...props}>
			{children}
		</main>
	);
});
