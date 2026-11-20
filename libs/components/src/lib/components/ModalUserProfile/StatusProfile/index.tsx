import { useAuth, useMemberStatus } from '@mezon/core';
import type { ChannelMembersEntity } from '@mezon/store';
import { accountActions, giveCoffeeActions, toastActions, useAppDispatch, useWallet, userClanProfileActions, walletActions } from '@mezon/store';
import { Menu, MezonIcon, MzIcons16, MzIcons20, MzIcons32 } from '@mezon/ui';

import {
	CURRENCY,
	EUserStatus,
	USER_PRO_PLAN_MIN_PRICE,
	USER_PRO_PLAN_PRICE,
	formatBalanceToString,
	generateE2eId,
	useAppLayout
} from '@mezon/utils';
import type { ReactElement, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonCopy } from '../../../components';
import ItemModal from '../../ClanHeader/ItemModal';
import ModalConfirm from '../../ModalConfirm';
import TransactionHistory from '../../TransactionHistory';
import ItemStatus from './ItemStatus';
import ItemStatusUpdate from './ItemStatusUpdate';

type StatusProfileProps = {
	userById: ChannelMembersEntity | null;
	isDM?: boolean;
	modalRef: React.MutableRefObject<boolean>;
	onClose: () => void;
};
const StatusProfile = ({ userById, isDM: _isDM, modalRef, onClose }: StatusProfileProps) => {
	const { t, i18n } = useTranslation(['userProfile', 'message']);
	const dispatch = useAppDispatch();
	const { isMobile } = useAppLayout();
	const [statusMenuVisible, setStatusMenuVisible] = useState(false);
	const handleCustomStatus = () => {
		dispatch(userClanProfileActions.setShowModalCustomStatus(true));
	};
	const getStatus = useMemberStatus(userById?.id || '');

	const { userProfile } = useAuth();
	const proPlanRecipientUserId = process.env.NX_PRO_PLAN_RECIPIENT_ID?.trim() ?? '';
	const isUserPro = Boolean(userProfile?.pro_plan || userProfile?.user?.pro_plan);
	const [isUserProConfirmOpen, setIsUserProConfirmOpen] = useState(false);
	const [isBuyingUserPro, setIsBuyingUserPro] = useState(false);

	const status = useMemo(() => {
		if (userById?.id !== userProfile?.user?.id) {
			return getStatus;
		}
		return {
			status: userProfile?.user?.status || EUserStatus.ONLINE,
			user_status: userProfile?.user?.user_status
		};
	}, [getStatus, userById?.id, userProfile?.user?.id, userProfile?.user?.status, userProfile?.user?.user_status]);
	const [isShowModalHistory, setIsShowModalHistory] = useState<boolean>(false);

	const { walletDetail } = useWallet();
	const handleBuyUserProPlan = async () => {
		const senderUserId = userProfile?.user?.id;
		if (!senderUserId || isUserPro || isBuyingUserPro) return;
		if (!proPlanRecipientUserId || USER_PRO_PLAN_PRICE < USER_PRO_PLAN_MIN_PRICE) {
			dispatch(toastActions.addToast({ message: t('statusProfile.userProPlan.purchaseUnavailable'), type: 'error' }));
			return;
		}

		setIsBuyingUserPro(true);
		try {
			const result = await dispatch(
				walletActions.buyUserProPlan({
					senderUserId,
					senderUsername: userProfile?.user?.username || '',
					recipientUserId: proPlanRecipientUserId
				})
			);
			if (walletActions.buyUserProPlan.fulfilled.match(result)) {
				dispatch(toastActions.addToast({ message: t('statusProfile.userProPlan.purchaseSubmitted'), type: 'success' }));
				setIsUserProConfirmOpen(false);
			}
		} finally {
			setIsBuyingUserPro(false);
		}
	};

	const handleSendToken = () => {
		dispatch(giveCoffeeActions.setShowModalSendToken(true));
	};

	const handleOpenHistoryModal = () => {
		setIsShowModalHistory(true);
	};
	const handleCloseHistoryModal = () => {
		setIsShowModalHistory(false);
	};

	const statusIcon = (status: string): ReactNode => {
		switch (status) {
			case EUserStatus.ONLINE:
				return <MezonIcon icon={MzIcons16.mzStatusOnline} className="text-[#16A34A]" />;
			case EUserStatus.IDLE:
				return <MezonIcon icon={MzIcons16.mzMoon} className="text-[#F0B232] -rotate-90" />;
			case EUserStatus.DO_NOT_DISTURB:
				return <MezonIcon icon={MzIcons16.mzMinusCircle} className="text-[#F23F43]" />;
			case EUserStatus.INVISIBLE:
				return <MezonIcon icon={MzIcons16.mzStatusOffline} className="text-[var(--mz-icon)]" />;
			default:
				return <MezonIcon icon={MzIcons16.mzStatusOffline} className="text-[var(--mz-icon)]" />;
		}
	};

	const getStatusText = (status: string): string => {
		switch (status) {
			case EUserStatus.ONLINE:
				return t('statusProfile.statusOptions.online');
			case EUserStatus.IDLE:
				return t('statusProfile.statusOptions.idle');
			case EUserStatus.DO_NOT_DISTURB:
				return t('statusProfile.statusOptions.doNotDisturb');
			case EUserStatus.INVISIBLE:
				return t('statusProfile.statusOptions.invisible');
			default:
				return t('statusProfile.statusOptions.online');
		}
	};
	const menuStatus = useMemo(() => {
		const updateUserStatus = (status: string, minutes: number, untilTurnOn: boolean) => {
			dispatch(
				accountActions.updateAccountStatus({
					status,
					minutes,
					until_turn_on: untilTurnOn
				})
			);
			dispatch(accountActions.updateUserStatus(status));
		};

		const menuItems: ReactElement[] = [
			<ItemStatus
				children={t('statusProfile.statusOptions.online')}
				startIcon={<MezonIcon icon={MzIcons16.mzStatusOnline} className="text-[#16A34A]" />}
				onClick={() => {
					updateUserStatus(EUserStatus.ONLINE, 0, true);
					modalRef.current = false;
					onClose();
				}}
			/>,
			<ItemStatusUpdate
				modalRef={modalRef}
				children={t('statusProfile.statusOptions.idle')}
				statusValue={EUserStatus.IDLE}
				startIcon={<MezonIcon icon={MzIcons16.mzMoon} className="-rotate-90 text-[#F0B232]" />}
				dropdown
				onClick={() => setStatusMenuVisible(false)}
			/>,
			<ItemStatusUpdate
				modalRef={modalRef}
				children={t('statusProfile.statusOptions.doNotDisturb')}
				description={t('statusProfile.statusOptionsDescriptions.doNotDisturb')}
				statusValue={EUserStatus.DO_NOT_DISTURB}
				startIcon={<MezonIcon icon={MzIcons16.mzMinusCircle} className="text-[#F23F43]" />}
				dropdown
				onClick={() => setStatusMenuVisible(false)}
			/>,
			<ItemStatusUpdate
				modalRef={modalRef}
				children={t('statusProfile.statusOptions.invisible')}
				description={t('statusProfile.statusOptionsDescriptions.invisible')}
				statusValue={EUserStatus.INVISIBLE}
				startIcon={<MezonIcon icon={MzIcons16.mzStatusOffline} className="text-[var(--mz-icon)]" />}
				dropdown
				onClick={() => setStatusMenuVisible(false)}
			/>
		];
		return <div>{menuItems}</div>;
	}, [dispatch, modalRef, onClose, t]);
	const handleChangeVisible = useCallback(
		(visible: boolean) => {
			modalRef.current = visible;
		},
		[modalRef]
	);

	return (
		<>
			<div className="max-md:relative">
				<ItemStatus
					children={`${t('statusProfile.balance')}: ${formatBalanceToString(walletDetail?.balance ?? '0')} ${CURRENCY.SYMBOL}`}
					startIcon={<MezonIcon icon={MzIcons16.mzWallet} className="text-[var(--mz-icon)]" />}
					disabled={true}
				/>
				<ItemStatus
					onClick={handleSendToken}
					children={t('statusProfile.transferFunds')}
					startIcon={<MezonIcon icon={MzIcons16.mzSendMoney} className="text-[var(--mz-icon)]" />}
				/>
				<ItemStatus
					onClick={handleOpenHistoryModal}
					children={t('statusProfile.historyTransaction.title')}
					startIcon={<MezonIcon icon={MzIcons16.mzHistory} className="text-[var(--mz-icon)]" />}
				/>

				<ItemStatus
					onClick={handleCustomStatus}
					children={status.user_status ? t('statusProfile.editCustomStatus') : t('statusProfile.setCustomStatus')}
					startIcon={<MezonIcon icon={MzIcons16.mzEmoji} className="text-[var(--mz-icon)] hover:text-[var(--mz-icon-selected)]" />}
				/>
				<Menu
					trigger="click"
					menu={menuStatus}
					visible={statusMenuVisible}
					onVisibleChange={(v) => {
						setStatusMenuVisible(v);
						handleChangeVisible(v);
					}}
					placement={isMobile ? 'bottom' : undefined}
					align={
						isMobile
							? {
									offset: [0, 4],
									points: ['tc', 'bc']
								}
							: {
									offset: [0, 10],
									points: ['br']
								}
					}
					className=" bg-theme-contexify text-theme-primary ml-2 py-[6px] px-[8px] w-[200px] max-md:!mx-auto "
				>
					<div className="capitalize ml-[1px] text-theme-primary" data-e2e={generateE2eId('short_profile.action.button.base')}>
						<ItemStatus
							children={getStatusText(status.status)}
							dropdown
							startIcon={statusIcon(status.status)}
							isdoNotDisturb={status.status === EUserStatus.DO_NOT_DISTURB}
						/>
					</div>
				</Menu>
			</div>

			<div className="w-full border-b-theme-primary opacity-70 text-center"></div>

			<ButtonCopy
				copyText={userProfile?.user?.id || ''}
				title={t('statusProfile.copyUserId')}
				className=" px-2 py-[6px] text-theme-primary-hover bg-item-theme-hover"
			/>
			<ItemModal
				className={
					isUserPro
						? 'text-theme-secondary'
						: 'rounded-md text-white shadow-sm transition-[filter] duration-150 ease-out hover:brightness-[1.03]'
				}
				style={
					isUserPro
						? undefined
						: {
								background:
									'linear-gradient(90deg, #7C3AED 0%, #853EE2 10%, #8F41D6 20%, #9843CB 30%, #A143C0 40%, #AB42B4 50%, #B540A8 60%, #BE3D9D 70%, #C83890 80%, #D13184 90%, #DB2777 100%)',
								backgroundImage: 'linear-gradient(90deg in oklab, #7C3AED 0%, #DB2777 100%)'
							}
				}
				onClick={() => setIsUserProConfirmOpen(true)}
				disabled={isUserPro}
				children={t('statusProfile.userProPlan.enable')}
				endIcon={<MezonIcon icon={MzIcons16.mzSparkles} className={isUserPro ? 'text-theme-secondary' : 'text-white'} />}
			/>
			{isShowModalHistory && <TransactionHistory onClose={handleCloseHistoryModal} />}
			{isUserProConfirmOpen && (
				<ModalConfirm
					handleCancel={() => setIsUserProConfirmOpen(false)}
					handleConfirm={handleBuyUserProPlan}
					title={t('statusProfile.userProPlan.confirmTitle')}
					buttonName={isBuyingUserPro ? t('statusProfile.userProPlan.processing') : t('statusProfile.userProPlan.confirmButton')}
					buttonColor="bg-indigo-600 hover:bg-indigo-700"
					customTitle={t('statusProfile.userProPlan.confirmMessage', {
						price: new Intl.NumberFormat(i18n.language).format(USER_PRO_PLAN_PRICE)
					})}
				/>
			)}
		</>
	);
};

const WalletIcon = () => <MezonIcon icon={MzIcons32.mzWallet} />;

const AddAccountModal = ({
	handleSetAccount,
	handleCloseModalAddAccount
}: {
	handleCloseModalAddAccount: () => void;
	handleSetAccount: (email: string, password: string) => void;
}) => {
	const { t } = useTranslation('userProfile');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const isFormValid = email.trim() !== '' && password.trim() !== '';

	const handleAddAccount = (e: React.FormEvent) => {
		e.preventDefault();
		if (!isFormValid) return;
		handleSetAccount(email, password);
	};

	return (
		<div
			onClick={(e) => {
				e.stopPropagation();
			}}
			className="w-[100dvw] h-[100dvh] bg-theme-setting-primary z-30 flex items-center justify-center bg-opacity-60 fixed top-0"
		>
			<form className="space-y-2 bg-theme-surface p-12 rounded-lg w-[400px]">
				<label htmlFor="email" className="block text-sm font-medium text-theme-primary">
					{t('statusProfile.addAccountModal.email')}
					<span className="text-red-500">*</span>
				</label>
				<div className="space-y-2">
					<input
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						id="email"
						className="w-full px-3 py-2 rounded-md border-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500 bg-input-secondary text-theme-message"
						type="email"
						placeholder={t('statusProfile.addAccountModal.emailPlaceholder')}
					/>
				</div>
				<div className="min-h-[20px]"></div>
				<div className="space-y-2">
					<label htmlFor="password" className="block text-sm font-medium text-theme-primary">
						{t('statusProfile.addAccountModal.password')}
						<span className="text-red-500">*</span>
					</label>
					<div className="relative">
						<input
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							id="password"
							type="password"
							className="w-full px-3 py-2 rounded-md pr-10 text-theme-message bg-input-secondary border-theme-primary



						focus:outline-none focus:ring-2 focus:ring-blue-500  "
							autoComplete="off"
							placeholder={t('statusProfile.addAccountModal.passwordPlaceholder')}
						/>
						<button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-primary">
							<MezonIcon icon={MzIcons20.mzEye} className="text-[var(--mz-icon)]" />
						</button>
					</div>
				</div>
				<div className="min-h-[20px]"></div>
				<div className="flex gap-2">
					<button
						className="w-full px-4 py-2 font-medium focus:outline-none  cursor-pointer  rounded-lg  text-[16px] leading-[24px] hover:underline text-theme-primary   whitespace-nowrap"
						onClick={handleCloseModalAddAccount}
					>
						{t('statusProfile.addAccountModal.cancel')}
					</button>
					<button
						onClick={handleAddAccount}
						type="submit"
						disabled={!isFormValid}
						className={`
              w-full rounded-lg px-4 py-2 font-medium leading-[24px] focus:outline-none
              ${isFormValid ? 'bg-[#5265ec] text-white hover:bg-[#4654c0]' : 'bg-gray-500 text-white'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
					>
						{t('statusProfile.addAccountModal.logIn')}
					</button>
				</div>
			</form>
		</div>
	);
};

export default StatusProfile;
