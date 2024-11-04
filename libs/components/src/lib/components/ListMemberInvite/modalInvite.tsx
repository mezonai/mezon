/* eslint-disable no-console */
import { useInvite } from '@mezon/core';
import { selectChannelById, selectChannelFirst, selectCurrentClan, selectCurrentClanId, useAppSelector } from '@mezon/store';
import { Modal } from '@mezon/ui';
import isElectron from 'is-electron';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ListMemberInvite from '.';

const expireAfter = ['30 minutes', '1 hour', '6 hours', '12 hours', '1 day', '7 days', 'Never'];

const maxNumberofUses = ['No limit', '1 use', '5 uses', '10 uses', '25 uses', '50 uses', '100 uses'];

export type ModalParam = {
	onClose: () => void;
	open: boolean;
	// url:string;
	channelID?: string;
	confirmButton?: () => void;
};

const ModalInvite = (props: ModalParam) => {
	const [expire, setExpire] = useState('7 days');
	const [max, setMax] = useState('No limit');
	const [modalEdit, setModalEdit] = useState(false);
	const [urlInvite, setUrlInvite] = useState('');
	const currentClanId = useSelector(selectCurrentClanId);
	const { createLinkInviteUser } = useInvite();
	const firstChannel = useSelector(selectChannelFirst);
	const { onClose, channelID } = props;

	const channel = useAppSelector((state) => selectChannelById(state, channelID ?? '')) || {};

	const clan = useSelector(selectCurrentClan);

	const handleOpenInvite = useCallback(async () => {
		try {
			const intiveIdChannel = (channelID ? channelID : firstChannel.channel_id) as string;
			const res = await createLinkInviteUser(currentClanId ?? '', intiveIdChannel, 10);
			if (res && res?.invite_link) {
				setUrlInvite((isElectron() ? process.env.NX_CHAT_APP_REDIRECT_URI : window.location.origin) + '/invite/' + res.invite_link);
			}
		} catch {
			console.log('Error when create invite link');
		}
	}, [firstChannel, channelID]);

	useEffect(() => {
		handleOpenInvite();
	}, []);

	const unsecuredCopyToClipboard = (text: string) => {
		const textArea = document.createElement('textarea');
		textArea.value = text;
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		try {
			document.execCommand('copy');
		} catch (err) {
			console.error('Unable to copy to clipboard', err);
		}
		document.body.removeChild(textArea);
	};

	const handleCopyToClipboard = (content: string) => {
		if (window.isSecureContext && navigator.clipboard) {
			navigator.clipboard.writeText(content);
		} else {
			unsecuredCopyToClipboard(content);
		}
	};

	const closeModalEdit = useCallback(() => setModalEdit(false), []);
	return !modalEdit ? (
		<Modal
			title={`Invite friends to ${clan?.clan_name}`}
			onClose={props.onClose}
			showModal={props.open}
			hasChannel={channel}
			classSubTitleBox="ml-[0px] cursor-default"
			borderBottomTitle="border-b "
			isInviteModal={true}
		>
			<div>
				<ListMemberInvite url={urlInvite} channelID={channelID} />
				<div className="relative ">
					<p className="pt-4 pb-1 text-[12px] mb-12px cursor-default uppercase font-semibold">Or, send a clan invite link to a friend</p>
					<input
						type="text"
						className="w-full h-11 border border-solid dark:border-none dark:bg-black bg-[#dfe0e2] rounded-[5px] px-[16px] py-[13px] text-[14px] outline-none"
						value={urlInvite}
						readOnly
					/>
					<button
						className="absolute right-0 bottom-0 mb-1 text-white font-semibold text-sm px-8 py-1.5
								shadow outline-none focus:outline-none ease-linear transition-all duration-150
								bg-primary hover:bg-blue-800 text-[16px] leading-6 rounded mr-[8px]"
						onClick={() => {
							handleCopyToClipboard(urlInvite);
							onClose();
						}}
					>
						Copy
					</button>
				</div>
				<p className="pt-1 text-[14px] mb-12px text-[#AEAEAE] inline-flex gap-x-2">
					<span className="cursor-default dark:text-white text-black">Your invite link expires in {expire} </span>
					<span className="dark:text-blue-300 text-blue-600 cursor-pointer hover:underline" onClick={() => setModalEdit(true)}>
						Edit invite link.
					</span>
				</p>
			</div>
		</Modal>
	) : (
		<Modal
			title="Clan invite link settings"
			onClose={closeModalEdit}
			showModal={modalEdit}
			classNameWrapperChild="space-y-5"
			classNameBox="max-w-[440px]"
		>
			<div className="space-y-2">
				<h3 className="text-xs font-bold dark:text-textSecondary text-textSecondary800 uppercase">Expire After</h3>
				<select
					name="expireAfter"
					className="block w-full dark:bg-black bg-bgModifierHoverLight dark:text-white text-black border dark:border-black rounded p-2 font-normal text-sm tracking-wide outline-none border-none"
					onChange={(e) => {
						setExpire(e.target.value);
					}}
					value={expire}
				>
					{expireAfter.map((item) => (
						<option key={item} value={item}>
							{item}
						</option>
					))}
				</select>
			</div>
			<div className="space-y-2">
				<h3 className="text-xs font-bold dark:text-textSecondary text-textSecondary800 uppercase">Max Number of Uses</h3>
				<select
					name="maxNumberofUses"
					className="block w-full dark:bg-black bg-bgModifierHoverLight dark:text-white text-black border dark:border-black rounded p-2 font-normal text-sm tracking-wide outline-none border-none"
					onChange={(e) => {
						setMax(e.target.value);
					}}
					value={max}
				>
					{maxNumberofUses.map((item) => (
						<option key={item} value={item}>
							{item}
						</option>
					))}
				</select>
			</div>
			<div className="flex justify-end gap-x-4">
				<button className="px-4 py-2 rounded bg-slate-500 hover:bg-opacity-85" onClick={closeModalEdit}>
					Cancel
				</button>
				<button className="px-4 py-2 rounded bg-primary hover:bg-opacity-85" onClick={closeModalEdit}>
					Generate a New Link
				</button>
			</div>
		</Modal>
	);
};
export default ModalInvite;
