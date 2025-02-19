import { ChannelsEntity, selectVoiceChannelMembersByChannelId, useAppSelector } from '@mezon/store';
import { VoiceChannelUsers } from './VoiceChannelUsers/VoiceChannelUsers';
interface PreJoinVoiceChannelProps {
	channel?: ChannelsEntity;
	roomName?: string;
	loading: boolean;
	handleJoinRoom: () => void;
	isCurrentChannel?: boolean;
}

export const PreJoinVoiceChannel: React.FC<PreJoinVoiceChannelProps> = ({ channel, roomName, loading, handleJoinRoom, isCurrentChannel }) => {
	const voiceChannelMembers = useAppSelector((state) => selectVoiceChannelMembersByChannelId(state, channel?.channel_id as string));
	return (
		<div className={`w-full h-full bg-black flex justify-center items-center ${isCurrentChannel ? 'hidden' : ''}`}>
			<div className="flex flex-col justify-center items-center gap-4 w-full text-white">
				<div className="w-full flex gap-2 justify-center p-2">
					{voiceChannelMembers.length > 0 && <VoiceChannelUsers memberJoin={voiceChannelMembers} memberMax={3}></VoiceChannelUsers>}
				</div>
				<div className="max-w-[350px] text-center text-3xl font-bold">
					{channel?.channel_label && channel?.channel_label.length > 20
						? `${channel?.channel_label.substring(0, 20)}...`
						: channel?.channel_label}
				</div>
				{voiceChannelMembers.length > 0 ? <div>Everyone is waiting for you inside</div> : <div>No one is currently in voice</div>}
				<button
					disabled={!roomName}
					className={`bg-green-700 rounded-3xl p-2 ${roomName ? 'hover:bg-green-600' : 'opacity-50'}`}
					onClick={handleJoinRoom}
				>
					{loading ? 'Joining...' : 'Join Voice'}
				</button>
			</div>
		</div>
	);
};
