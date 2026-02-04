import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface CustomTooltipProps {
	children: React.ReactNode;
	text: string;
	offsetX?: number;
}

export const CustomTooltip = ({ children, text, offsetX = 12 }: CustomTooltipProps) => {
	const [isVisible, setIsVisible] = useState(false);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const triggerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isVisible || !triggerRef.current) return;

		const updatePosition = () => {
			const rect = triggerRef.current?.getBoundingClientRect();
			if (!rect) return;

			setPosition({
				top: rect.top - 8,
				left: rect.left + rect.width / 2
			});
		};

		updatePosition();
		window.addEventListener('scroll', updatePosition, true);
		window.addEventListener('resize', updatePosition);

		return () => {
			window.removeEventListener('scroll', updatePosition, true);
			window.removeEventListener('resize', updatePosition);
		};
	}, [isVisible]);

	return (
		<>
			<div ref={triggerRef} className="relative inline-block" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
				{children}
			</div>
			{isVisible &&
				createPortal(
					<div
						className="fixed pointer-events-none z-[9999]"
						style={{
							top: `${position.top}px`,
							left: `${position.left}px`,
							transform: 'translate(-50%, -100%)'
						}}
					>
						<div className="relative">
							<div className="bg-tooltip-channelapp rounded-lg px-3 py-2 shadow-lg">
								<span className="text-tooltip-app text-sm font-medium block truncate max-w-[100px]">{text}</span>
							</div>
							<div className="absolute top-full left-1/2 -translate-x-1/2">
								<div
									className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px]"
									style={{ borderTopColor: 'var(--bg-tooltip-app)' }}
								/>
							</div>
						</div>
					</div>,
					document.body
				)}
		</>
	);
};
