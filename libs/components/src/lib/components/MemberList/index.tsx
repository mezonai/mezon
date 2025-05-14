import { selectCurrentClanId } from '@mezon/store';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import { MemberContextMenuProvider } from '../../contexts/MemberContextMenu';
import ListMember from './listMember';

export type MemberListProps = { className?: string };

function MemberList() {
	const currentClanId = useSelector(selectCurrentClanId);

	return (
		<MemberContextMenuProvider>
			<div className={`contain-strict self-stretch h-full flex-col justify-start items-start flex gap-[24px] w-full`}>
				<div className="w-full">
					<div className="flex flex-col gap-4 pr-[2px]">
						<ListMember key={currentClanId} />
					</div>
				</div>
			</div>
		</MemberContextMenuProvider>
	);
}

export default memo(MemberList);
