import { selectStatusMenu, selectVoiceChannelMembersByChannelId, useAppSelector } from '@mezon/store';
import { MezonIcon, MzIcons16, MzIcons20 } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import type { ReactNode } from 'react';
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
	isPrivateVoice: boolean;
	isChatOpen: boolean;
	onToggleChat: () => void;
	children?: ReactNode;
}

export const SfuPreJoinVoiceChannel: React.FC<PreJoinVoiceChannelProps> = ({
	channel_label,
	channel_id,
	loading,
	handleJoinRoom,
	isCurrentChannel,
	clan_id,
	isPrivateVoice,
	isChatOpen,
	onToggleChat,
	children
}) => {
	const { t } = useTranslation(['common', 'channelTopbar']);
	const voiceChannelMembers = useAppSelector((state) => selectVoiceChannelMembersByChannelId(state, channel_id as string, clan_id as string));
	const statusMenu = useAppSelector(selectStatusMenu);
	const [joinRole, setJoinRole] = useState<SfuJoinRole>('speaker');
	const [showJoinOptions, setShowJoinOptions] = useState(false);
	const joinLabel = joinRole === 'speaker' ? 'Join as speaker' : 'Join as audience';

	return (
		<div
			className={`flex w-full h-full
				${isCurrentChannel ? 'hidden' : ''}
				${statusMenu ? 'max-sbm:hidden' : ''}`}
		>
			<div className="flex min-w-0 flex-1 flex-col bg-theme-primary">
				<header className="flex h-heightTopBar shrink-0 items-center justify-between gap-5 p-3 border-b-theme-primary bg-theme-chat text-theme-primary">
					<div className="flex min-w-0 items-center gap-3 text-lg">
						<MezonIcon icon={isPrivateVoice ? MzIcons20.mzSpeakerLock : MzIcons20.mzSpeaker} className="shrink-0 text-[var(--mz-icon)]" />
						<p className="min-w-0 truncate text-base font-semibold leading-5 text-theme-message">{channel_label}</p>
					</div>
					<button
						type="button"
						title={t(isChatOpen ? 'channelTopbar:tooltips.hideChat' : 'channelTopbar:tooltips.showChat')}
						className={`focus-visible:outline-none hover:text-[var(--mz-icon-selected)] ${isChatOpen ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)]'}`}
						onClick={onToggleChat}
						data-e2e={generateE2eId('chat.channel_message.header.button.chat')}
					>
						<MezonIcon icon={MzIcons20.mzChat} />
					</button>
				</header>
				<div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-4 text-white">
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
							<MezonIcon icon={MzIcons16.mzChevronDown} className="text-white" />
						</button>
						{showJoinOptions && (
							<div className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-lg border border-color-primary bg-theme-setting-nav py-1 text-left shadow-xl">
								{(['speaker', 'audience'] as const).map((role) => (
									<button
										key={role}
										type="button"
										className="block w-full px-4 py-2 text-left text-sm text-theme-primary-active bg-item-theme-hover"
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
			{children}
		</div>
	);
};
