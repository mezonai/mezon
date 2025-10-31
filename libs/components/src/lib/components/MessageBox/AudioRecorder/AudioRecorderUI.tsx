import React from 'react';
import { MessageAudio } from '../../MessageWithUser/MessageAudio/MessageAudio';

type AudioRecorderUIProps = {
	isRecording: boolean;
	seconds: number;
	audioUrl: string;
	onStopRecording: () => void;
	onSendRecording: () => void;
	onResetRecording: () => void;
};

export const AudioRecorderUI: React.FC<AudioRecorderUIProps> = React.memo(
	({ isRecording, seconds, audioUrl, onStopRecording, onSendRecording, onResetRecording }) => (
		<div className="pb-2.5 font-[Arial,sans-serif]">
			<div className="flex items-center gap-2.5 p-2.5 rounded-[5px] text-white w-[400px]">
				<button onClick={onResetRecording} className="bg-white text-[#505cdc] border-none rounded-full w-[30px] h-[30px] cursor-pointer">
					✖
				</button>

				<div className="flex-1 flex items-center justify-center gap-2.5">
					{isRecording ? (
						<span>{new Date(seconds * 1000).toISOString().substring(14, 19)}</span>
					) : audioUrl ? (
						<MessageAudio audioUrl={audioUrl} />
					) : null}

					{isRecording && (
						<button
							onClick={onStopRecording}
							className="bg-white text-[#505cdc] border-none rounded-full w-[30px] h-[30px] cursor-pointer"
						>
							⏹
						</button>
					)}
				</div>

				<button onClick={onSendRecording} className="bg-white text-[#505cdc] border-none rounded-full w-[30px] h-[30px] cursor-pointer">
					➤
				</button>
			</div>
		</div>
	)
);
