import { ChannelMembersEntity, selectAllChannelMembers, useAppSelector } from '@mezon/store';
import { useMemo } from 'react';

export type useDirectMembersOptions = {
	channelId?: string | null;
};

export function useDirectMembers({ channelId }: useDirectMembersOptions = {}) {
	const rawMembers = useAppSelector((state) => selectAllChannelMembers(state, channelId as string));

	const members = useMemo(() => {
		if (!rawMembers) {
			return [];
		}
		const roles = [
			{
				id: '',
				title: ''
			}
		];

		return roles.map((role) => {
			const categoryChannels = rawMembers.filter(
				//   (member) => member && member?.roleId === role.id
				(member) => member
			) as ChannelMembersEntity[];
			return {
				...role,
				users: categoryChannels
			};
		});
	}, [rawMembers]);

	return {
		members
	};
}
