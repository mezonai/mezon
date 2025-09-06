import { ReactNode } from 'react';

type GuideItemLayoutProps = {
	icon?: ReactNode;
	action?: ReactNode;
	background?: string;
	className?: string;
	hightLightIcon?: boolean;
	title?: string;
	description?: ReactNode;
	height?: string;
	gap?: number;
	onClick?: () => void;
	noNeedHover?: boolean;
};

export const GuideItemLayout = ({
	title,
	description,
	icon,
	hightLightIcon = false,
	action,
	className,
	background = '',
	height,
	gap = 8,
	onClick,
	noNeedHover
}: GuideItemLayoutProps) => {
	return (
		<div
			className={`p-4 flex items-start rounded-lg ${noNeedHover ? '' : 'bg-item-hover border-theme-primary bg-theme-setting-nav text-theme-primary-hover'} ${height ? height : 'h-full'} ${background} ${className}`}
			style={{
				gap: gap
			}}
			onClick={onClick}
		>
			{icon && (
				<div className="h-full flex items-center justify-center">
					<div className={`${hightLightIcon ? 'rounded-full w-12 aspect-square ' : ''}  flex items-center justify-center`}>{icon}</div>
				</div>
			)}
			<div className={`flex flex-1 text-base flex-col h-full justify-center text-theme-primary `}>
				{title && <div className="font-bold text-theme-primary-active">{title}</div>}
				{description && <div className="text-xs flex-1">{description}</div>}
			</div>
			{action && <div className="flex items-center h-full">{action}</div>}
		</div>
	);
};

export default GuideItemLayout;
