import { useWindowSize } from '@mezon/core';

type CustomModalMentionsProps = {
	children: React.ReactNode;
	titleModalMention: string;
	isThreadBoxOrTopicBox?: boolean;
};

const CustomModalMentions = ({ children, titleModalMention, isThreadBoxOrTopicBox }: CustomModalMentionsProps) => {
	const { height } = useWindowSize();
	const maxHeight = height * (2 / 3);

	return (
		<div
			style={{ maxHeight }}
			className={` absolute ${isThreadBoxOrTopicBox ? 'left-[40px] w-[475px]' : 'w-[98.5%] left-[-8px]'}  
				bottom-10 pb-3 rounded dark:bg-bgSecondary bg-[#F9F9F9] z-[9999] overflow-hidden shadow dark:shadow-neutral-900 shadow-neutral-300`}
		>
			<div className="first:mt-0 mt-3 border-b border-borderDivider last:border-b-0 last:bottom-b-0 pb-3 last:pb-0">
				<div className="flex items-center justify-between p-2 h-10">
					<h3 className="text-xs font-bold text-textPrimaryLight dark:text-textPrimary uppercase">{titleModalMention}</h3>
				</div>
				{children}
			</div>
		</div>
	);
};

export default CustomModalMentions;
