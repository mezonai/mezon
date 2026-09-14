import type { HTMLAttributes } from 'react';

export const SfuFocusLayoutContainer = ({ children, className = '', ...props }: HTMLAttributes<HTMLElement>) => (
	<main className={`relative flex min-h-0 flex-1 flex-col p-4 ${className}`} {...props}>
		{children}
	</main>
);
