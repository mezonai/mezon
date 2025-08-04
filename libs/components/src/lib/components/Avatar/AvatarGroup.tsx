import { ReactNode } from 'react';

interface IAvatarGroup {
	children: ReactNode;
	className?: string;
}
const AvatarGroup = ({ children, className }: IAvatarGroup) => {
	return <div className={`flex items-center *:-mr-1 ${className}`}>{children}</div>;
};

export const AvatarRound = ({ className, src }: { className?: string; src: string }) => {
	return <img src={src} className={`rounded-full h-6 aspect-square object-cover ${className}`} />;
};

export const AvatarCount = ({ number }: { number: number }) => {
	return (
		<div className="h-6 w-6 rounded-full aspect-square text-xs font-medium border-2 border-bgModifierHover flex items-center justify-center dark:text-bgLightPrimary text-bgPrimary ring-transparent dark:bg-bgTertiary bg-bgLightTertiary dark:hover:bg-bgTertiary hover:bg-bgLightTertiary">
			+{number}
		</div>
	);
};

export default AvatarGroup;
