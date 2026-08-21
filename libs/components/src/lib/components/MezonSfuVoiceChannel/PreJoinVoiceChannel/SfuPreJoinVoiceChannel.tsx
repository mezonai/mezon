import { selectStatusMenu, selectVoiceChannelMembersByChannelId, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SfuJoinRole } from '../types';
import { VoiceChannelUsers } from './VoiceChannelUsers/VoiceChannelUsers';

interface PreJoinVoiceChannelProps {
	channel_label?: string;
	channel_id?: string;
	clan_id?: string;
	roomName?: string;
	loading: boolean;
	handleJoinRoom: (role: SfuJoinRole) => void;
	isCurrentChannel?: boolean;
}

export const SfuPreJoinVoiceChannel: React.FC<PreJoinVoiceChannelProps> = ({
	channel_label,
	channel_id,
	loading,
	handleJoinRoom,
	isCurrentChannel,
	clan_id
}) => {
	const { t } = useTranslation('common');
	const voiceChannelMembers = useAppSelector((state) => selectVoiceChannelMembersByChannelId(state, channel_id as string, clan_id as string));
	const statusMenu = useAppSelector(selectStatusMenu);
	const [joinRole, setJoinRole] = useState<SfuJoinRole>('speaker');
	const [showJoinOptions, setShowJoinOptions] = useState(false);
	const joinLabel = joinRole === 'speaker' ? 'Join as speaker' : 'Join as audience';

	return (
		<div
			className={`w-full h-full bg-gray-300 dark:bg-black flex justify-center items-center
				${isCurrentChannel ? 'hidden' : ''}
				${statusMenu ? 'max-sbm:hidden' : ''}`}
		>
			<div className="flex flex-col justify-center items-center gap-4 w-full text-white">
				<div className="w-full flex gap-2 justify-center p-2">
					{voiceChannelMembers.length > 0 && <VoiceChannelUsers voiceChannelMembers={voiceChannelMembers}></VoiceChannelUsers>}
				</div>
				<div
					className="max-w-[350px] text-center text-3xl font-bold text-gray-800 dark:text-white"
					data-e2e={generateE2eId('clan_page.screen.voice_room.channel_name')}
				>
					{channel_label && channel_label.length > 20 ? `${channel_label.substring(0, 20)}...` : channel_label}
				</div>
				{voiceChannelMembers.length > 0 ? (
					<div className="text-gray-800 dark:text-white">{t('everyoneWaitingInside')}</div>
				) : (
					<div className="text-gray-800 dark:text-white">{t('noOneInVoice')}</div>
				)}
				<div className="relative flex w-64">
					<button
						disabled={!channel_id || loading}
						className={`flex-1 rounded-l-3xl bg-green-700 px-4 py-2 font-semibold text-white ${channel_id ? 'hover:bg-green-600' : 'opacity-50'}`}
						onClick={() => handleJoinRoom(joinRole)}
						data-e2e={generateE2eId('clan_page.screen.voice_room.button.join_voice')}
					>
						{loading ? t('joining') : joinLabel}
					</button>
					<button
						type="button"
						disabled={!channel_id || loading}
						className="flex w-10 items-center justify-center rounded-r-3xl border-l border-green-800 bg-green-700 hover:bg-green-600 disabled:opacity-50"
						onClick={() => setShowJoinOptions((visible) => !visible)}
						aria-label="Choose join role"
					>
						<Icons.ArrowDown className="h-3 w-3 text-white" />
					</button>
					{showJoinOptions && (
						<div className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-lg border border-zinc-700 bg-[#20202d] py-1 text-left shadow-xl">
							{(['speaker', 'audience'] as const).map((role) => (
								<button
									key={role}
									type="button"
									className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-700"
									onClick={() => {
										setJoinRole(role);
										setShowJoinOptions(false);
									}}
								>
									Join as {role}
								</button>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
