import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { useState } from 'react';

type SelectItemProps = {
	title?: string;
	content?: string;
	onClick?: () => void;
	className?: string;
};

const SelectItem = ({ title, content, onClick, className }: SelectItemProps) => {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<button
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={onClick}
			className={`flex flex-row justify-between items-center group w-full cursor-pointer rounded py-1 px-2 ${className} bg-item-hover`} // Apply className
			data-e2e={generateE2eId('chat.search_message.button.select')}
		>
			<div>
				<span className={`${title === '~' ? 'font-extrabold' : 'font-semibold'} text-theme-primary-active`}>{`${title} `}</span>
				<span className="">{content}</span>
			</div>
			{className === 'bg-item-theme' || className === 'bg-item-theme' || isHovered ? (
				<div className={` transition-colors duration-300`}>
					<Icons.Plus />
				</div>
			) : null}
		</button>
	);
};

export default SelectItem;
