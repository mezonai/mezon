import { ColorRoleProvider, useEscapeKeyClose, useFriends } from '@mezon/core';
import {
	EStateFriend,
	reportMessageActions,
	selectAllAccount,
	selectFriendStatus,
	selectMemberClanByUserId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { TextArea } from '@mezon/ui';
import type { IMessageWithUser } from '@mezon/utils';
import { KEY_KEYBOARD } from '@mezon/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import MessageWithUser from '../MessageWithUser';

type ReportMessageModalProps = {
	mess: IMessageWithUser;
	mode: number;
	closeModal: () => void;
};

export const ReportMessageModal = (props: ReportMessageModalProps) => {
	const { mess, closeModal, mode } = props;
	const { t } = useTranslation('contextMenu');
	const dispatch = useAppDispatch();
	const userId = useSelector(selectAllAccount)?.user?.id;
	const currentClanUser = useAppSelector((state) => selectMemberClanByUserId(state, userId as string));
	const friendStatus = useAppSelector((state) => selectFriendStatus(mess?.sender_id || '')(state));
	const modalRef = useRef<HTMLDivElement>(null);
	const { blockFriend } = useFriends();

	const reportedUserName = mess?.clan_nick || mess?.display_name || mess?.username;

	const reportReasons = [
		{ id: 'spam', label: t('reportMessageModal.reasons.spam') },
		{ id: 'harassment', label: t('reportMessageModal.reasons.harassment') },
		{ id: 'hate_speech', label: t('reportMessageModal.reasons.hate_speech') },
		{ id: 'violence', label: t('reportMessageModal.reasons.violence') },
		{ id: 'inappropriate_content', label: t('reportMessageModal.reasons.inappropriate_content') },
		{ id: 'scam', label: t('reportMessageModal.reasons.scam') },
		{ id: 'other', label: t('reportMessageModal.reasons.other') }
	];

	const [selectedReason, setSelectedReason] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showActionModal, setShowActionModal] = useState(false);
	const [customReason, setCustomReason] = useState<string>('');

	const handleReportMessage = useCallback(async () => {
		if (!selectedReason || !mess?.id) return;
		if (selectedReason === 'other' && !customReason.trim()) return;

		setIsSubmitting(true);
		try {
			const abuseType = selectedReason === 'other' ? customReason.trim() : selectedReason;
			await dispatch(
				reportMessageActions.reportMessageAbuse({
					messageId: mess.id,
					abuseType
				})
			).unwrap();
			setShowActionModal(true);
		} catch (error) {
			console.error('Failed to report message:', error);
		} finally {
			setIsSubmitting(false);
		}
	}, [selectedReason, customReason, mess?.id, dispatch]);

	const handleIgnoreUser = useCallback(() => {
		toast.success(t('reportMessageModal.userMessagesIgnored'));
		closeModal();
	}, [closeModal, t]);

	const handleBlockUser = useCallback(async () => {
		if (!mess?.sender_id || !mess?.username) return;
		if (friendStatus !== EStateFriend.FRIEND) {
			toast.error(t('reportMessageModal.canOnlyBlockFriends'));
			return;
		}

		try {
			await blockFriend(mess.username, mess.sender_id);
			toast.success(t('reportMessageModal.userBlockedSuccess'));
			closeModal();
		} catch (error) {
			toast.error(t('reportMessageModal.userBlockedFailed'));
		}
	}, [mess?.sender_id, mess?.username, friendStatus, blockFriend, closeModal, t]);

	const handleSkipActions = useCallback(() => {
		closeModal();
	}, [closeModal]);

	useEffect(() => {
		const handleEnterKey = (event: KeyboardEvent) => {
			if (event.keyCode === KEY_KEYBOARD.ENTER && selectedReason) {
				handleReportMessage();
			}
		};

		document.addEventListener('keydown', handleEnterKey);
		return () => {
			document.removeEventListener('keydown', handleEnterKey);
		};
	}, [handleReportMessage, selectedReason]);

	useEscapeKeyClose(modalRef, closeModal);

	if (showActionModal) {
		return (
			<div ref={modalRef} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
				<div className="w-full max-w-[480px] flex flex-col overflow-hidden rounded-xl bg-theme-setting-primary shadow-2xl">
					<div className="flex flex-col p-6">
						<h3 className="mb-2 text-xl font-bold text-theme-primary-active">{t('reportMessageModal.actionModal.title')}</h3>
						<p className="mb-6 text-sm leading-relaxed text-theme-primary opacity-90">
							{t('reportMessageModal.actionModal.description')}
						</p>

						<div className="flex flex-col gap-3">
							<button
								onClick={handleIgnoreUser}
								className="group flex w-full flex-col items-start rounded-lg bg-theme-setting-nav p-4 transition-all hover:bg-theme-setting-nav-hover active:scale-[0.99] hover:scale-x-105"
							>
								<span className="text-base font-semibold text-theme-primary group-hover:text-theme-primary-active">
									{t('reportMessageModal.actionModal.ignoreMessages')}
								</span>
								<span className="mt-1 text-xs text-theme-primary opacity-70">
									{t('reportMessageModal.actionModal.ignoreDescription')}{' '}
									<span className="font-semibold text-theme-primary-active">{reportedUserName}</span>
								</span>
							</button>

							<button
								onClick={handleBlockUser}
								className="group flex w-full flex-col items-start rounded-lg bg-theme-setting-nav p-4 transition-all hover:bg-theme-setting-nav-hover active:scale-[0.99] hover:scale-x-105"
							>
								<span className="text-base font-semibold text-colorDanger group-hover:opacity-80">
									{t('reportMessageModal.actionModal.blockUser')}
								</span>
								<span className="mt-1 text-xs text-theme-primary opacity-70">
									{t('reportMessageModal.actionModal.blockDescription')}{' '}
									<span className="font-semibold text-theme-primary-active">{reportedUserName}</span>
								</span>
							</button>
						</div>

						<div className="mt-6 flex justify-end">
							<button
								onClick={handleSkipActions}
								className="rounded px-4 py-2 text-sm font-medium text-theme-primary transition-colors hover:text-theme-primary-active hover:underline"
							>
								{t('reportMessageModal.actionModal.skip')}
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div ref={modalRef} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
			<div className="w-full max-w-[540px] flex flex-col overflow-hidden rounded-xl bg-theme-setting-primary shadow-2xl">
				<div className="flex flex-col p-6 pb-2">
					<h3 className="mb-2 text-xl font-bold text-theme-primary-active">{t('reportMessageModal.title')}</h3>
					<p className="text-sm text-theme-primary opacity-90">{t('reportMessageModal.description')}</p>
				</div>

				<div className="flex-1 overflow-y-auto p-6 hide-scrollbar max-h-[60vh]">
					<div className="mb-6 rounded-lg border-theme-primary p-3 bg-theme-setting-nav/20 overflow-hidden max-h-48 thread-scroll">
						<ColorRoleProvider>
							<MessageWithUser
								isSearchMessage={true}
								allowDisplayShortProfile={false}
								message={mess}
								mode={mode}
								isMention={true}
								isShowFull={true}
								user={currentClanUser}
							/>
						</ColorRoleProvider>
					</div>

					<div className="flex flex-col gap-2">
						<p className="mb-2 text-sm font-semibold uppercase tracking-wider text-theme-primary opacity-70">
							{t('reportMessageModal.selectReason')}
						</p>

						<div className="flex flex-col gap-1">
							{reportReasons.map((reason) => (
								<label
									key={reason.id}
									className={`flex cursor-pointer items-center gap-3 rounded-lg p-3  ${
										selectedReason === reason.id ? 'bg-item-theme ' : 'bg-item-theme-hover'
									}`}
								>
									<input
										type="radio"
										name="reportReason"
										value={reason.id}
										checked={selectedReason === reason.id}
										onChange={(e) => setSelectedReason(e.target.value)}
										className="sr-only"
									/>
									<span
										className={`text-sm ${selectedReason === reason.id ? 'font-medium text-theme-primary-active' : 'text-theme-primary'}`}
									>
										{reason.label}
									</span>
								</label>
							))}
						</div>

						{selectedReason === 'other' && (
							<div className="mt-3 ">
								<TextArea
									value={customReason}
									onChange={(e) => setCustomReason(e.target.value.slice(0, 64))}
									placeholder={t('reportMessageModal.customReasonPlaceholder')}
									maxLength={64}
									className="w-full rounded-lg bg-theme-input p-3 text-sm text-theme-primary transition-all placeholder:text-theme-primary/40"
									rows={3}
								/>
								<div className="mt-1 text-right text-xs text-theme-primary opacity-60">{customReason.length}/64</div>
							</div>
						)}
					</div>
				</div>

				<div className="flex items-center justify-end gap-3   bg-theme-setting-nav p-4 sm:p-6">
					<button
						onClick={closeModal}
						disabled={isSubmitting}
						className="rounded-lg px-5 py-2.5 text-sm font-medium text-theme-primary transition-colors hover:bg-theme-setting-nav disabled:opacity-50"
					>
						{t('reportMessageModal.cancel')}
					</button>
					<button
						onClick={handleReportMessage}
						disabled={!selectedReason || isSubmitting || (selectedReason === 'other' && !customReason.trim())}
						className="btn-primary btn-primary-hover min-w-[100px] rounded-lg px-5 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSubmitting ? t('reportMessageModal.submitting') : t('reportMessageModal.submit')}
					</button>
				</div>
			</div>
		</div>
	);
};
