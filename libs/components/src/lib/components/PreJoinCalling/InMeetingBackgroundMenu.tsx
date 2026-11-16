import { memo, useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { BackgroundSelector } from './BackgroundSelector';
import { VisualEffectsIcon } from './VideoPreview';
import type { BackgroundMode } from './mediaPipeBackground';

export interface InMeetingBackgroundMenuProps {
	selectedMode: BackgroundMode | null;
	onSelectMode: (mode: BackgroundMode | null) => void;
	containerRef: RefObject<HTMLDivElement | null>;
}

export const InMeetingBackgroundMenu = memo(({ selectedMode, onSelectMode, containerRef }: InMeetingBackgroundMenuProps) => {
	const [panelPosition, setPanelPosition] = useState<{ top: number; right: number } | null>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const isOpen = panelPosition !== null;

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Node;
			if (menuRef.current?.contains(target) || panelRef.current?.contains(target)) return;
			setPanelPosition(null);
		};
		const close = () => setPanelPosition(null);
		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			window.addEventListener('resize', close);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			window.removeEventListener('resize', close);
		};
	}, [isOpen]);

	const togglePanel = () => {
		const container = containerRef.current;
		if (isOpen || !menuRef.current || !container) {
			setPanelPosition(null);
			return;
		}
		const anchor = menuRef.current.getBoundingClientRect();
		const bounds = container.getBoundingClientRect();
		setPanelPosition({ top: anchor.bottom - bounds.top + 8, right: bounds.right - anchor.right });
	};

	return (
		<div className="relative" ref={menuRef}>
			<button
				type="button"
				onClick={togglePanel}
				className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 rounded-full text-xs font-medium text-white shadow-lg backdrop-blur transition-all"
				title="Backgrounds"
			>
				<VisualEffectsIcon size={16} className="text-white" />
				<span>Backgrounds</span>
			</button>
			{panelPosition &&
				containerRef.current &&
				createPortal(
					<div
						ref={panelRef}
						style={{ top: panelPosition.top, right: panelPosition.right }}
						className="absolute w-72 sm:w-80 max-w-[calc(100vw-2rem)] p-3 bg-zinc-900/95 border border-zinc-700 rounded-xl shadow-2xl backdrop-blur-md z-50"
					>
						<BackgroundSelector selectedMode={selectedMode} onSelectMode={onSelectMode} />
					</div>,
					containerRef.current
				)}
		</div>
	);
});

export default InMeetingBackgroundMenu;
