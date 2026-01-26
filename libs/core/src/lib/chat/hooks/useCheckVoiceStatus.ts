import { selectNumberMemberVoiceChannel, useAppSelector } from '@mezon/store';

export const useCheckVoiceStatus = (channelId: string, clanId: string) => {
	const numberMembersVoice = useAppSelector((state) => selectNumberMemberVoiceChannel(state, channelId, clanId));
	return !!channelId && !!numberMembersVoice && numberMembersVoice >= 2;
};
