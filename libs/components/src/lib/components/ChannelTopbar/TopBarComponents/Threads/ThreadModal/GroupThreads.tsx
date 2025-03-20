import { ThreadsEntity } from '@mezon/store';
import { MutableRefObject } from 'react';
import ThreadItem from './ThreadItem';

interface GroupThreadsProps {
	title: string;
	threads: ThreadsEntity[];
	measureRef?: (node: HTMLLIElement | null) => void;
	preventClosePannel: MutableRefObject<boolean>;
}

const GroupThreads = ({ title, threads, measureRef, preventClosePannel }: GroupThreadsProps) => {
	if (threads.length === 0) return null;

	return (
		<div>
			<div className="mt-2 mb-2 h-6 text-xs font-semibold leading-6 uppercase dark:text-bgLightPrimary text-bgPrimary">
				{title} ({threads.length})
			</div>
			<ul>
				{threads.map((thread, index) => {
					const isLast = index === threads.length - 1;
					return (
						<li key={thread.id} ref={isLast ? measureRef : undefined}>
							<ThreadItem
								preventClosePannel={preventClosePannel}
								isPublicThread={true}
								thread={thread}
								setIsShowThread={() => {}}
								isHasContext={false}
							/>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export default GroupThreads;
