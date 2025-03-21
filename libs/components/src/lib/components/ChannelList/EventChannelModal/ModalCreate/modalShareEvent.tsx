import { ChannelsEntity } from '@mezon/store';
import { Icons } from '@mezon/ui';
import isElectron from 'is-electron';
import { ChannelType } from 'mezon-js';
import { useState } from 'react';

type ModalShareEventProps = {
	channel: ChannelsEntity;
	onClose: () => void;
	setOpenModalShareEvent: React.Dispatch<React.SetStateAction<boolean>>;
	onHandle: (e: any) => void;
};

const ModalShareEvent = (props: ModalShareEventProps) => {
	const { channel, onClose, setOpenModalShareEvent, onHandle } = props;

	const [copied, setCopied] = useState(false);

	const origin = isElectron() ? process.env.NX_CHAT_APP_REDIRECT_URI : window.location.origin;

	const link =
		channel.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE
			? `https://meet.google.com/${channel.meeting_code}`
			: `${origin}/chat/clans/${channel.clan_id}/channels/${channel.channel_id}`;

	const copyToClipboard = () => {
		navigator.clipboard
			.writeText(link)
			.then()
			.catch((err) => {
				console.error('Failed to copy the link: ', err);
			});
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const closeModal = () => {
		setOpenModalShareEvent(false);
	};

	return (
		<div
			className="w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center"
			onClick={(e) => {
				onHandle(e);
				onClose();
			}}
		>
			<div className="w-fit h-fit dark:bg-bgPrimary bg-bgLightModeThird rounded-lg flex-col justify-start  items-start gap-3 inline-flex overflow-hidden">
				<div className="dark:text-white text-black w-[440px] p-4">
					<div className="flex justify-between pb-4 font-bold text-base">
						<h3>Invite friends to event?</h3>
						<button title="Close" onClick={closeModal} className="dark:hover:text-white hover:text-colorTextLightMode transition">
							✕
						</button>
					</div>
					<div className="pb-4 flex gap-x-2">
						<Icons.Speaker />
						<p>{channel.channel_label}</p>
					</div>
					<p className="pb-4">Share this link with others to grant access to this server</p>
					<div
						className={`flex items-center dark:bg-black bg-gray-300 p-1 rounded-lg border ${copied ? 'border-green-500' : 'dark:border-black border-gray-300'}`}
					>
						<input
							type="text"
							value={link}
							readOnly
							className="bg-transparent dark:text-white text-black flex-1 px-2 outline-none truncate"
						/>
						<button
							onClick={copyToClipboard}
							className={`w-16 text-white  py-2 rounded-md text-sm font-medium text-center ${
								copied ? 'bg-green-500' : 'bg-indigo-500 hover:bg-indigo-600'
							}`}
						>
							{copied ? 'Copied!' : 'Copy'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
export default ModalShareEvent;
