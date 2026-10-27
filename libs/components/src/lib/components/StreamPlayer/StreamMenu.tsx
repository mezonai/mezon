import { Icons } from '@mezon/ui';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export type StreamMenuOption = { id: string; label: string };

type StreamMenuProps = {
	label: string;
	trigger: ReactNode;
	options: StreamMenuOption[];
	selectedId: string;
	onSelect: (id: string) => void;
	onOpenChange?: (open: boolean) => void;
};

export function StreamMenu({ label, trigger, options, selectedId, onSelect, onOpenChange }: StreamMenuProps) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		onOpenChange?.(true);
		const handlePointerDown = (event: PointerEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpen(false);
		};
		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
			onOpenChange?.(false);
		};
	}, [open, onOpenChange]);

	return (
		<div ref={rootRef} className="relative">
			<button
				type="button"
				title={label}
				aria-label={label}
				aria-haspopup="menu"
				aria-expanded={open}
				className="flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
				onClick={() => setOpen((prev) => !prev)}
			>
				{trigger}
			</button>
			{open && (
				<div
					role="menu"
					aria-label={label}
					className="absolute bottom-full right-0 z-10 mb-2 w-60 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-neutral-600 bg-neutral-800 text-sm text-white shadow-lg"
				>
					<div className="border-b border-neutral-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
						{label}
					</div>
					<div className="max-h-60 overflow-y-auto">
						{options.map((option, index) => {
							const selected = option.id === selectedId;
							return (
								<button
									key={`${option.id}-${index}`}
									type="button"
									role="menuitemradio"
									aria-checked={selected}
									className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-neutral-700 ${selected ? 'bg-neutral-700/80 text-blue-300' : ''}`}
									onClick={() => {
										onSelect(option.id);
										setOpen(false);
									}}
								>
									<span className="flex h-4 w-4 shrink-0 items-center justify-center">
										{selected && <Icons.Check className="h-4 w-4" />}
									</span>
									<span className="truncate">{option.label}</span>
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
