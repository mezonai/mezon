import type { UsersStreamEntity, VoiceEntity } from '@mezon/store';
import type { IChannelMember } from '@mezon/utils';
import UserListItem from './UserListItemVoiceChannel';

export type UserListVoiceChannelProps = {
	readonly channelID: string;
	channelType?: number;
	memberList: VoiceEntity[] | UsersStreamEntity[];
	isPttList?: boolean;
};

function UserListVoiceChannel({ channelID, channelType, memberList, isPttList }: UserListVoiceChannelProps) {
	return memberList?.map((item: IChannelMember) => {
		return (
			<div key={item.id} className={isPttList ? 'w-full' : 'mt-[1px]'}>
				<UserListItem isPttList={isPttList} user={item} channelID={channelID} />
			</div>
		);
	});
}

export default UserListVoiceChannel;
