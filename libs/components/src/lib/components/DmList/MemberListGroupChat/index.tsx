import { useAppParams, useAuth } from '@mezon/core';
import type { ChannelMembersEntity } from '@mezon/store';
import { selectMemberByGroupId, useAppSelector } from '@mezon/store';
import { generateE2eId } from '@mezon/utils';
import isElectron from 'is-electron';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { MemberContextMenuProvider } from '../../../contexts';
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
	const { t } = useTranslation('common');
	const { directId } = useAppParams();
	const rawMembers = useAppSelector((state) => selectMemberByGroupId(state, directId as string));
	const { userId } = useAuth();

	return (
		<div className="self-stretch w-full h-[268px] flex-col justify-start items-start flex pt-[16px] pb-[16px] ml-2 mr-1 gap-[24px]">
			<div className="w-full">
				<p
					className="mb-3 ml-2 font-semibold flex items-center gap-[4px] font-title text-xs tracking-wide uppercase"
					data-e2e={generateE2eId(`chat.direct_message.member_list.member_count`)}
				>
					{t('member').toUpperCase()} - {rawMembers?.length}
				</p>
				{
					<div className={`flex flex-col ${isElectron() ? 'pb-8' : ''}`}>
						<MemberContextMenuProvider>
							{rawMembers?.map((user: ChannelMembersEntity, index) => (
								<div key={user.id} className="p-2 rounded bg-item-hover">
									<MemberItem
										user={user}
										directMessageId={directMessageId}
										isMobile={user.user?.is_mobile}
										isMe={userId === user.id}
										createId={createId}
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
