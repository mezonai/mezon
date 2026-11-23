import { useAppParams, useAuth } from '@mezon/core';
import type { ChannelMembersEntity, RootState } from '@mezon/store';
import { selectIsProUser, selectMemberByGroupId, useAppSelector } from '@mezon/store';
import { generateE2eId } from '@mezon/utils';
import { createSelector } from '@reduxjs/toolkit';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { shallowEqual } from 'react-redux';
import { MemberContextMenuProvider } from '../../../contexts';
import MemberItem from '../../MemberList/MemberItem';
import { useProPalette } from '../../ProfileBadges';

const EMPTY_PRO_USERS: Record<string, boolean> = {};

const selectGroupProUsers = createSelector(
	[
		(state: RootState) => state.account,
		(state: RootState) => state.usersClan,
		(state: RootState) => state.clans?.currentClanId,
		(_state: RootState, members?: ChannelMembersEntity[]) => members
	],
	(account, usersClan, currentClanId, members): Record<string, boolean> => {
		if (!members?.length) return EMPTY_PRO_USERS;
		const sliceState = {
			account,
			usersClan,
			clans: { currentClanId }
		};
		const result: Record<string, boolean> = {};
		for (const member of members) {
			const memberId = member.user?.id || member.id;
			if (memberId && selectIsProUser(sliceState, memberId)) {
				result[memberId] = true;
			}
		}
		return result;
	}
);

export type MemberListProps = {
	className?: string;
	directMessageId: string | undefined;
	createId?: string | undefined;
};

export type DataMemberCreate = {
	createId: string;
};

function MemberListGroupChat({ directMessageId, createId }: MemberListProps) {
	const { t } = useTranslation('common');
	const { directId } = useAppParams();
	const rawMembers = useAppSelector((state) => selectMemberByGroupId(state, directId as string));
	const proUsers = useAppSelector((state) => selectGroupProUsers(state, rawMembers), shallowEqual);
	const proPalette = useProPalette();
	const { userId } = useAuth();

	return (
		<div className="self-stretch w-full h-[268px] flex-col justify-start items-start flex pt-[16px] pb-[16px] ml-2 mr-1 gap-[24px]">
			<div className="w-full">
				<p
					className="mb-3 ml-2 font-semibold flex items-center gap-[4px] font-title text-xs tracking-wide uppercase"
					data-e2e={generateE2eId(`chat.direct_message.member_list.member_count`)}
				>
					{t('members').toUpperCase()} - {rawMembers?.length}
				</p>
				{
					<div className={`flex flex-col`}>
						<MemberContextMenuProvider>
							{rawMembers?.map((user: ChannelMembersEntity, index) => (
								<div key={user.id} className="p-2 rounded bg-item-hover">
									<MemberItem
										user={user}
										directMessageId={directMessageId}
										isMobile={user.user?.is_mobile}
										isMe={userId === user.id}
										createId={createId}
										isPro={Boolean(proUsers[user.user?.id || user.id])}
										proPalette={proPalette}
									/>
								</div>
							))}
						</MemberContextMenuProvider>
					</div>
				}
			</div>
		</div>
	);
}

export default memo(MemberListGroupChat);
