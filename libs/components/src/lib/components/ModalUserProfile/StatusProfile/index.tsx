import { useAuth, useMemberCustomStatus } from '@mezon/core';
import type { ChannelMembersEntity } from '@mezon/store';
import {
	accountActions,
	authActions,
	clanMembersMetaActions,
	clansActions,
	clearApiCallTracker,
	giveCoffeeActions,
	selectOthersSession,
	selectUserStatus,
	useAppDispatch,
	userClanProfileActions,
	userStatusActions
} from '@mezon/store';
import { createClient as createMezonClient, useMezon } from '@mezon/transport';
import { Icons, Menu } from '@mezon/ui';
import { CURRENCY, EUserStatus, formatBalanceToString, useWallet } from '@mezon/utils';
import isElectron from 'is-electron';
import { Session } from 'mezon-js';
import type { ReactElement, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ButtonCopy } from '../../../components';
import TransactionHistory from '../../TransactionHistory';
import ItemProfile from './ItemProfile';
import ItemStatus from './ItemStatus';
import ItemStatusUpdate from './ItemStatusUpdate';

type StatusProfileProps = {
	userById: ChannelMembersEntity | null;
	isDM?: boolean;
	modalRef: React.MutableRefObject<boolean>;
	onClose: () => void;
};
const StatusProfile = ({ userById, isDM, modalRef, onClose }: StatusProfileProps) => {
	const { t } = useTranslation('userProfile');
	const dispatch = useAppDispatch();
	const allAccount = useSelector(selectOthersSession);
	const user = userById?.user;
	const handleCustomStatus = () => {
		dispatch(userClanProfileActions.setShowModalCustomStatus(true));
	};
	const userCustomStatus = useMemberCustomStatus(user?.id || '', isDM);
	const userStatus = useSelector(selectUserStatus);
	const status = userStatus?.status || 'Online';
	const { userProfile } = useAuth();
	const [isShowModalHistory, setIsShowModalHistory] = useState<boolean>(false);

	const { isEnableWallet, walletDetail, enableWallet, fetchWalletData } = useWallet();

	useEffect(() => {
		fetchWalletData();
	}, [fetchWalletData]);

	const handleSendToken = () => {
		dispatch(giveCoffeeActions.setShowModalSendToken(true));
	};

	const handleOpenHistoryModal = () => {
		setIsShowModalHistory(true);
	};
	const handleCloseHistoryModal = () => {
		setIsShowModalHistory(false);
	};

	const handleEnableWallet = () => {
		enableWallet();
	};

	const statusIcon = (status: string): ReactNode => {
		switch (status) {
			case EUserStatus.ONLINE:
				return <Icons.OnlineStatus />;
			case EUserStatus.IDLE:
				return <Icons.DarkModeIcon className="text-[#F0B232] -rotate-90" />;
			case EUserStatus.DO_NOT_DISTURB:
				return <Icons.MinusCircleIcon />;
			case EUserStatus.INVISIBLE:
				return <Icons.OfflineStatus />;
			default:
				return <Icons.OnlineStatus />;
		}
	};
	const updateUserStatus = (status: string, minutes: number, untilTurnOn: boolean) => {
		dispatch(
			userStatusActions.updateUserStatus({
				status,
				minutes,
				until_turn_on: untilTurnOn
			})
		);
		dispatch(clanMembersMetaActions.updateUserStatus({ userId: userProfile?.user?.id || '', user_status: status }));
		dispatch(accountActions.updateUserStatus(status));
	};

	const { createSocket, connectWithSession } = useMezon();
	const navigate = useNavigate();
	const handleSetAccount = (email: string, password: string) => {
		if (isElectron()) {
			const gw_login = {
				host: process.env.NX_CHAT_APP_API_GW_HOST as string,
				port: process.env.NX_CHAT_APP_API_GW_PORT as string,
				key: process.env.NX_CHAT_APP_API_KEY as string,
				ssl: process.env.NX_CHAT_APP_API_SECURE === 'true'
			};
			const clientLogin = createMezonClient(gw_login);

			clientLogin.authenticateEmail(email, password).then((response) => {
				dispatch(authActions.setSession(response));
			});
			navigate('/chat/direct/friend');
			closeModalAddAccount();
			modalRef.current = false;
		}
	};

	const [openModalAddAccount, closeModalAddAccount] = useModal(() => {
		return <AddAccountModal handleSetAccount={handleSetAccount} handleCloseModalAddAccount={handleCloseModalAddAccount} />;
	});

	const handleSwitchAccount = async () => {
		if (isElectron()) {
			clearApiCallTracker();
			localStorage.removeItem('remember_channel');

			dispatch(clansActions.setCurrentClanId('0'));
			navigate('/chat/direct/friend');
			await createSocket();

			if (allAccount) {
				const { token, refresh_token, created, api_url, is_remember, user_id } = allAccount;

				const session = new Session(token, refresh_token, created, api_url, !!is_remember);

				await connectWithSession({ ...session, is_remember: true });
				if (user_id) dispatch(authActions.switchAccount(user_id));
			}
		}
	};

	const handleOpenSwitchAccount = useCallback(() => {
		if (isElectron()) {
			openModalAddAccount();
			modalRef.current = true;
		}
	}, [modalRef, openModalAddAccount]);

	const handleCloseModalAddAccount = () => {
		closeModalAddAccount();
		modalRef.current = false;
	};

	const menuStatus = useMemo(() => {
		const menuItems: ReactElement[] = [
			<ItemStatus
				children={t('statusProfile.statusOptions.online')}
				startIcon={<Icons.OnlineStatus />}
				onClick={() => {
					updateUserStatus('Online', 0, true);
					modalRef.current = false;
					onClose();
				}}
			/>,
			<ItemStatusUpdate
				modalRef={modalRef}
				children={t('statusProfile.statusOptions.idle')}
				startIcon={<Icons.DarkModeIcon className="text-[#F0B232] -rotate-90" />}
				dropdown
				onClick={onClose}
			/>,
			<ItemStatusUpdate
				onClick={onClose}
				modalRef={modalRef}
				children={t('statusProfile.statusOptions.doNotDisturb')}
				startIcon={<Icons.MinusCircleIcon />}
				dropdown
			/>,
			<ItemStatusUpdate
				onClick={onClose}
				modalRef={modalRef}
				children={t('statusProfile.statusOptions.invisible')}
				startIcon={<Icons.OfflineStatus />}
				dropdown
			/>
		];
		return <>{menuItems}</>;
	}, [modalRef, onClose, updateUserStatus, t]);
	const handleChangeVisible = (visible: boolean) => {
		modalRef.current = visible;
	};

	const menuAccount = useMemo(() => {
		if (!allAccount) {
			return (<ItemStatus children={t('statusProfile.manageAccounts')} onClick={handleOpenSwitchAccount} />) as ReactElement;
		}
		return (<ItemProfile username={allAccount?.username} onClick={handleSwitchAccount} />) as ReactElement;
	}, [allAccount, handleOpenSwitchAccount, handleSwitchAccount, t]);
	return (
		<>
			<div className="max-md:relative">
				{isEnableWallet ? (
					<>
						<ItemStatus
							children={`Balance: ${formatBalanceToString(walletDetail?.balance ?? '0')} ${CURRENCY.SYMBOL}`}
							startIcon={<Icons.Check className="text-theme-primary" />}
							disabled={true}
						/>
						<ItemStatus
							onClick={handleSendToken}
							children="Transfer Funds"
							startIcon={<Icons.SendMoney className="text-theme-primary" />}
						/>
						<ItemStatus
							onClick={handleOpenHistoryModal}
							children="History Transaction"
							startIcon={<Icons.History className="text-theme-primary" />}
						/>
					</>
				) : (
					<ItemStatus
						onClick={handleEnableWallet}
						children="Enable Wallet"
						startIcon={
							<span className="w-5 h-5 flex items-center justify-center text-theme-primary">
								<WalletIcon />
							</span>
						}
					/>
				)}

				<ItemStatus
					onClick={handleCustomStatus}
					children={userCustomStatus ? t('statusProfile.editCustomStatus') : t('statusProfile.setCustomStatus')}
					startIcon={<Icons.SmilingFace className="text-theme-primary" />}
				/>
				<Menu
					trigger="click"
					menu={menuStatus}
					onVisibleChange={handleChangeVisible}
					align={{
						offset: [0, 10],
						points: ['br']
					}}
					className=" bg-theme-contexify text-theme-primary ml-2 py-[6px] px-[8px] w-[200px] max-md:!left-auto max-md:!top-auto max-md:!transform-none max-md:!min-w-full "
				>
					<div className="capitalize ml-[1px] text-theme-primary">
						<ItemStatus children={status} dropdown startIcon={statusIcon(status)} />
					</div>
				</Menu>
			</div>
			<div className="w-full border-b-theme-primary opacity-70 text-center"></div>
			{isElectron() && (
				<Menu
					menu={menuAccount}
					trigger="click"
					placement="bottomRight"
					align={{
						offset: [0, 10],
						points: ['br']
					}}
					className="bg-theme-setting-primary border-none ml-2 py-[6px] px-[8px] w-[100px] max-md:!left-auto max-md:!top-auto max-md:!transform-none max-md:!min-w-full"
				>
					<div>
						<ItemStatus children={t('statusProfile.switchAccounts')} dropdown startIcon={<Icons.ConvertAccount />} />
					</div>
				</Menu>
			)}

			<ButtonCopy
				copyText={userProfile?.user?.id || ''}
				title={t('statusProfile.copyUserId')}
				className=" px-2 py-[6px] text-theme-primary-hover bg-item-theme-hover"
			/>
			{isShowModalHistory && <TransactionHistory onClose={handleCloseHistoryModal} />}
		</>
	);
};

const WalletIcon = () => (
	<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
		<path d="M17 7H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zM6 9h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zm11-2H7V6a2 2 0 0 1 4 0h2a4 4 0 0 0-8 0v1H5a1 1 0 0 0 0 2h12a1 1 0 0 0 0-2z" />
		<circle cx="15" cy="13" r="1" />
	</svg>
);

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
							<svg
								aria-hidden="true"
								role="img"
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								fill="none"
								viewBox="0 0 24 24"
								className="w-5 h-5"
							>
								<path
									fill="currentColor"
									d="M15.56 11.77c.2-.1.44.02.44.23a4 4 0 1 1-4-4c.21 0 .33.25.23.44a2.5 2.5 0 0 0 3.32 3.32Z"
								></path>
								<path
									fill="currentColor"
									fillRule="evenodd"
									d="M22.89 11.7c.07.2.07.4 0 .6C22.27 13.9 19.1 21 12 21c-7.11 0-10.27-7.11-10.89-8.7a.83.83 0 0 1 0-.6C1.73 10.1 4.9 3 12 3c7.11 0 10.27 7.11 10.89 8.7Zm-4.5-3.62A15.11 15.11 0 0 1 20.85 12c-.38.88-1.18 2.47-2.46 3.92C16.87 17.62 14.8 19 12 19c-2.8 0-4.87-1.38-6.39-3.08A15.11 15.11 0 0 1 3.15 12c.38-.88 1.18-2.47 2.46-3.92C7.13 6.38 9.2 5 12 5c2.8 0 4.87 1.38 6.39 3.08Z"
									clipRule="evenodd"
								></path>
							</svg>
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
