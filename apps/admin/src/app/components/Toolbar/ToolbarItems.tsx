import React, { useEffect, useRef, useState } from 'react';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface ToolbarItemsProps extends React.HTMLAttributes<HTMLDivElement> {
	icon: React.ReactNode;
	label: string;
	isActive: boolean;
	onClick: () => void;
	tooltipPosition?: TooltipPosition;
}

const ToolbarItems: React.FC<ToolbarItemsProps> = ({ icon, label, isActive = false, onClick, tooltipPosition = 'right' }) => {
	const [showTooltip, setShowTooltip] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	const handleMouseEnter = () => {
		timeoutRef.current = setTimeout(() => setShowTooltip(true), 300);
	};

	const handleMouseLeave = () => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		setShowTooltip(false);
	};

	const tooltipStyles = {
		right: 'left-full ml-3 top-1/2 -translate-y-1/2',
		left: 'right-full mr-3 top-1/2 -translate-y-1/2',
		top: 'bottom-full mb-3 left-1/2 -translate-x-1/2',
		bottom: 'top-full mt-3 left-1/2 -translate-x-1/2'
	};

	const arrowStyles = {
		right: 'top-1/2 -translate-y-1/2 -left-1.5 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent border-r-[6px]',
		left: 'top-1/2 -translate-y-1/2 -right-1.5 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent border-l-[6px]',
		top: 'left-1/2 -translate-x-1/2 -bottom-1.5 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent border-t-[6px]',
		bottom: 'left-1/2 -translate-x-1/2 -top-1.5 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent border-b-[6px]'
	};

	return (
		<div className="relative flex items-center justify-center p-1" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
			<button
				type="button"
				onClick={onClick}
				className={`
          flex items-center justify-center w-[42px] h-[42px] 
          rounded-xl transition-all duration-200 ease-out
          border border-transparent
		  bg-[#222222]
          ${isActive ? 'bg-[#ff6d5a] text-white shadow-lg shadow-orange-900/20' : 'text-gray-400 hover:ring-orange-500 hover:text-orange-500 hover:border-orange-500'}
        `}
			>
				<div className="w-5 h-5 flex items-center justify-center">{icon}</div>
			</button>

			{showTooltip && (
				<div
					className={`
            absolute z-50 
            px-3 py-1.5 rounded-md bg-gray-800 text-white text-xs font-medium 
            shadow-xl border border-gray-700 whitespace-nowrap pointer-events-none
            animate-in fade-in zoom-in-95 duration-200
            ${tooltipStyles[tooltipPosition]}
          `}
				>
					{label}
					{/* Mũi tên tooltip */}
					<div className={`absolute w-0 h-0 border-solid ${arrowStyles[tooltipPosition]}`} />
				</div>
			)}
		</div>
	);
};

export default ToolbarItems;
