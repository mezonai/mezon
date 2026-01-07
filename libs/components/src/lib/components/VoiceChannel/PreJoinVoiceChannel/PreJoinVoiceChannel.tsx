import { selectStatusMenu, selectVoiceChannelMembersByChannelId, useAppSelector } from '@mezon/store';
import { generateE2eId } from '@mezon/utils';
import { useTranslation } from 'react-i18next';
import { VoiceChannelUsers } from './VoiceChannelUsers/VoiceChannelUsers';

interface PreJoinVoiceChannelProps {
	channelLabel?: string;
	channelId?: string;
	roomName?: string;
	loading: boolean;
	handleJoinRoom: () => void;
	isCurrentChannel?: boolean;
}

export const PreJoinVoiceChannel: React.FC<PreJoinVoiceChannelProps> = ({
	channelLabel,
	channelId,
	roomName,
	loading,
	handleJoinRoom,
	isCurrentChannel
}) => {
	const { t } = useTranslation('common');
	const voiceChannelMembers = useAppSelector((state) => selectVoiceChannelMembersByChannelId(state, channelId as string));
	const statusMenu = useAppSelector(selectStatusMenu);

	return (
		<div
			className={`w-full h-full bg-gray-300 dark:bg-black flex justify-center items-center
				${isCurrentChannel ? 'hidden' : ''}
				${statusMenu ? 'max-sbm:hidden' : ''}`}
		>
			<div className="flex flex-col justify-center items-center gap-4 w-full text-white">
				<div className="w-full flex gap-2 justify-center p-2">
					{voiceChannelMembers.length > 0 && <VoiceChannelUsers memberJoin={voiceChannelMembers} memberMax={3}></VoiceChannelUsers>}
				</div>
				<div className="max-w-[350px] text-center text-3xl font-bold text-gray-800 dark:text-white">
					{channelLabel && channelLabel.length > 20 ? `${channelLabel.substring(0, 20)}...` : channelLabel}
				</div>
				{voiceChannelMembers.length > 0 ? (
					<div className="text-gray-800 dark:text-white">{t('everyoneWaitingInside')}</div>
				) : (
					<div className="text-gray-800 dark:text-white">{t('noOneInVoice')}</div>
				)}
				<button
					disabled={!roomName || loading}
					className={`bg-green-700 rounded-3xl p-2 ${roomName ? 'hover:bg-green-600' : 'opacity-50'}`}
					onClick={handleJoinRoom}
					data-e2e={generateE2eId('clan_page.screen.voice_room.button.join_voice')}
				>
					{loading ? t('joining') : t('joinVoice')}
				</button>
			</div>
		</div>
	);
};
