import { useAppParams } from '@mezon/core';
import { ChannelMembersEntity, selectGrouplMembers, useAppSelector } from '@mezon/store';
import { MemberProfileType } from '@mezon/utils';
import isElectron from 'is-electron';
import { memo } from 'react';
import MemberItem from '../../MemberList/MemberItem';

export type MemberListProps = {
	className?: string;
	directMessageId: string | undefined;
	createId?: string | undefined;
};

export type DataMemberCreate = {
	createId: string;
};

function MemberListGroupChat({ directMessageId, createId }: MemberListProps) {
	const { directId } = useAppParams();
	const rawMembers = useAppSelector((state) => selectGrouplMembers(state, directId as string));

	const memberGroups = rawMembers.sort((a, b) => {
		const nameA = a.user?.display_name?.toLowerCase() || a.user?.username?.toLowerCase() || '';
		const nameB = b.user?.display_name?.toLowerCase() || b.user?.username?.toLowerCase() || '';
		return nameA.localeCompare(nameB);
	});

	const dataMemberCreate: DataMemberCreate = { createId: createId || '' };

	return (
		<div className="self-stretch w-full h-[268px] flex-col justify-start items-start flex pt-[16px] pb-[16px] ml-2 mr-1 gap-[24px]">
			<div className="w-full">
				<p className="mb-3 ml-2 text-[#AEAEAE] font-semibold flex items-center gap-[4px] font-title text-xs tracking-wide uppercase">
					MEMBER - {memberGroups.length}
				</p>
				{
					<div className={`flex flex-col gap-4 text-[#AEAEAE] ${isElectron() ? 'pb-8' : ''}`}>
						{memberGroups.map((user: ChannelMembersEntity) => (
							<div key={user.id} className="p-2 rounded dark:hover:bg-bgModifierHover hover:bg-bgLightModeButton">
								<MemberItem
									user={user}
									name={user.user?.display_name || user.user?.username}
									positionType={MemberProfileType.DM_MEMBER_GROUP}
									listProfile={true}
									dataMemberCreate={dataMemberCreate}
									directMessageId={directMessageId}
									isOffline={!user.user?.online}
									isMobile={user.user?.is_mobile}
									isDM={true}
								/>
							</div>
						))}
					</div>
				}
			</div>
		</div>
	);
}

export default memo(MemberListGroupChat);
