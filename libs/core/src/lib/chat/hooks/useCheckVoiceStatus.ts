import { selectNumberMemberVoiceChannel, useAppSelector } from '@mezon/store';

export const useCheckVoiceStatus = (channelId: string) => {
	const numberMembersVoice = useAppSelector((state) => selectNumberMemberVoiceChannel(state, channelId));
	return !!channelId && !!numberMembersVoice && numberMembersVoice >= 2;
};
