import { ISFUUsersEntity, UsersStreamEntity, VoiceEntity } from '@mezon/store';
import { IChannelMember } from '@mezon/utils';
import UserListItem from './UserListItemVoiceChannel';

export type UserListVoiceChannelProps = {
	readonly channelID: string;
	channelType?: number;
	memberList: VoiceEntity[] | UsersStreamEntity[] | ISFUUsersEntity[];
	isPttList?: boolean;
};

function UserListVoiceChannel({ channelID, channelType, memberList, isPttList }: UserListVoiceChannelProps) {
	return memberList?.map((item: IChannelMember, index: number) => {
		return (
			<div key={item.id} className={isPttList ? 'w-full' : ''}>
				<UserListItem isPttList={isPttList} user={item} channelID={channelID} />
			</div>
		);
	});
}

export default UserListVoiceChannel;
