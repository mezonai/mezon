import { useInvite } from '@mezon/core';
import { clansActions, useAppDispatch } from '@mezon/store';
import { Image, MezonIcon, MzIcons16 } from '@mezon/ui';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface IFirstJoinPopup {
	openCreateClanModal: () => void;
}

const FirstJoinPopup = ({ openCreateClanModal }: IFirstJoinPopup) => {
	const { t } = useTranslation('common');
	const [isOpen, setIsOpen] = useState(true);
	const [inputValue, setInputValue] = useState('');
	const [error, setError] = useState(false);
	const [joinPending, setJoinPending] = useState(false);
	const navigate = useNavigate();
	const { inviteUser } = useInvite();
	const dispatch = useAppDispatch();

	const handleClose = () => {
		setIsOpen(false);
	};

	const handleJoinClan = async () => {
		//mezon.ai
		const url = `${process.env.NX_DOMAIN_URL}/invite/`;
		const lengthInviteCode = 19;
		if (inputValue.startsWith(url) && inputValue.length === url.length + lengthInviteCode) {
			const idInvite = inputValue.split('/').pop();
			if (idInvite && idInvite.length === lengthInviteCode && idInvite.match('\\d+')) {
				const res = await inviteUser(idInvite);
				if (res?.join_pending) {
					setJoinPending(true);
					return;
				}
				if (res?.channel_id && res?.clan_id) {
					navigate(`/chat/clans/${res.clan_id}/channels/${res.channel_id}`);
					handleClose();
					dispatch(clansActions.fetchClans({ noCache: true }));
				}
			}
		} else {
			setError(true);
		}
	};
	const handleSetInputValue = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (error) {
				setError(false);
			}
			if (joinPending) {
				setJoinPending(false);
			}
			setInputValue(e.target.value);
		},
		[error, joinPending]
	);

	if (!isOpen) {
		return null;
	}
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 bg-[#000000c9]">
			<div className="relative z-10 w-[680px] flex max-sm:justify-center">
				<Image src={`/assets/images/first-join-bg.svg`} width={240} className="object-cover rounded-l-md max-sm:hidden" />
				<div className="text-[#4e5058] bg-white rounded-r-md max-sm:rounded-md relative flex flex-col">
					<MezonIcon icon={MzIcons16.mzClose} onClick={handleClose} className="absolute top-5 right-5 cursor-pointer" />
					<div className="px-[16px] flex flex-col h-full flex-1 gap-4 pt-20">
						<div className="text-center">
							<div className="text-black text-[13px]">{t('firstJoinPopup.ifYouHaveInvitation')}</div>
							<div className="text-black font-bold text-[25px]">{t('firstJoinPopup.joinClan')}</div>
							<div>{t('firstJoinPopup.enterInvitationLink')}</div>
						</div>
						<div className="flex flex-col gap-[5px]">
							<div className=" text-xs font-bold flex flex-1 items-center justify-between">
								<p className="uppercase">{t('firstJoinPopup.invitationLink')}</p>
								{error && <p className="text-[10px]  font-semibold italic text-red-500">{t('firstJoinPopup.invitationInvalid')}</p>}
							</div>
							<input
								value={inputValue}
								onChange={handleSetInputValue}
								type="text"
								className="bg-[#dfe0e2] outline-primary border border-white hover:border-[#979a9e] w-full rounded-md p-[10px] text-[15px]"
							/>
							<div className="text-xs flex flex-col gap-2">{t('firstJoinPopup.example')}</div>
							{joinPending && (
								<div className="mt-2 rounded-md border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-700">
									<div className="font-semibold">{t('invite.requestSentTitle')}</div>
									<div>{t('invite.requestSentDesc')}</div>
								</div>
							)}
						</div>
					</div>
					<div className="p-[16px] flex justify-between">
						<div className="flex items-center gap-1	">
							<div>
								{t('firstJoinPopup.or')}{' '}
								<span
									onClick={() => {
										openCreateClanModal();
										handleClose();
									}}
									className="font-semibold hover:underline cursor-pointer"
								>
									{t('firstJoinPopup.createYourOwnClan')}
								</span>
							</div>
						</div>
						<button
							onClick={joinPending ? handleClose : handleJoinClan}
							className={`${inputValue === '' && !joinPending ? 'bg-[#959cf1]' : 'bg-[#5865f2] hover:bg-[#444ec1]'} text-white px-[13px] py-[5px] rounded-sm select-none`}
							disabled={inputValue === '' && !joinPending}
						>
							{joinPending ? t('close') : t('firstJoinPopup.joinClan')}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FirstJoinPopup;
