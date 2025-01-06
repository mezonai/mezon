import { useAuth, useMemberCustomStatus } from '@mezon/core';
import {
	ChannelMembersEntity,
	accountActions,
	giveCoffeeActions,
	selectUserStatus,
	useAppDispatch,
	userClanProfileActions,
	userStatusActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EUserStatus, formatNumber } from '@mezon/utils';
import { Dropdown } from 'flowbite-react';
import { safeJSONParse } from 'mezon-js';
import { ReactNode, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import HistoryTransaction from '../../HistoryTransaction';
import SettingRightWithdraw from '../../SettingProfile/SettingRightWithdraw';
import ItemProfile from './ItemProfile';
import ItemStatus from './ItemStatus';
import ItemStatusUpdate from './ItemStatusUpdate';

type StatusProfileProps = {
	userById: ChannelMembersEntity | null;
	isDM?: boolean;
};
const StatusProfile = ({ userById, isDM }: StatusProfileProps) => {
	const dispatch = useAppDispatch();
	const user = userById?.user;
	const handleCustomStatus = () => {
		dispatch(userClanProfileActions.setShowModalCustomStatus(true));
	};
	const userCustomStatus = useMemberCustomStatus(user?.id || '', isDM);
	const userStatus = useSelector(selectUserStatus);
	const status = userStatus?.status || 'online';
	const { userProfile } = useAuth();
	const tokenInWallet = useMemo(() => {
		const parse = safeJSONParse(userProfile?.wallet ?? '').value;
		return parse;
	}, [userProfile?.wallet]);
	const [isShowModalWithdraw, setIsShowModalWithdraw] = useState<boolean>(false);
	const [isShowModalHistory, setIsShowModalHistory] = useState<boolean>(false);

	const handleSendToken = () => {
		dispatch(giveCoffeeActions.setShowModalSendToken(true));
	};

	const handleOpenWithdrawModal = () => {
		setIsShowModalWithdraw(true);
	};
	const handleCloseWithdrawModal = () => {
		setIsShowModalWithdraw(false);
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
				return <Icons.OnlineStatus />;
			case EUserStatus.IDLE:
				return <Icons.DarkModeIcon className="text-[#F0B232] -rotate-90" />;
			case EUserStatus.DO_NOT_DISTURB:
				return <Icons.MinusCircleIcon />;
			case EUserStatus.INVISIBLE:
				return <Icons.OnlineStatus />;
			default:
				return <Icons.OnlineStatus />;
		}
	};
	const updateUserStatus = (status: string, minutes: number, untilTurnOn: boolean) => {
		dispatch(
			userStatusActions.updateUserStatus({
				status: status,
				minutes: minutes,
				until_turn_on: untilTurnOn
			})
		);
		dispatch(accountActions.updateUserStatus(status));
	};
	return (
		<>
			<div>
				<Dropdown
					label=""
					trigger="click"
					dismissOnClick={true}
					renderTrigger={() => (
						<div>
							<ItemStatus
								children={`Token: ${formatNumber(Number(tokenInWallet), 'vi-VN', 'VND')}`}
								dropdown
								startIcon={<Icons.Check />}
							/>
						</div>
					)}
					placement="right-start"
					className="dark:!bg-bgSecondary600 !bg-white border ml-2 py-[6px] px-[8px] w-[200px]"
				>
					<ItemStatus onClick={handleSendToken} children="Send Token" startIcon={<Icons.SendMoney />} />
					<ItemStatus
						onClick={handleOpenWithdrawModal}
						children="Withdraw Token"
						startIcon={<Icons.SendMoney className="transform scale-x-[-1] scale-y-[-1]" />}
					/>
					<ItemStatus
						onClick={handleOpenHistoryModal}
						children="History Transaction"
						startIcon={<Icons.History className="bg-green-500" />}
					/>
				</Dropdown>
				<Dropdown
					trigger="click"
					dismissOnClick={true}
					renderTrigger={() => (
						<div>
							<ItemStatus children={status} dropdown startIcon={statusIcon(status)} />
						</div>
					)}
					label=""
					placement="right-start"
					className="dark:!bg-bgSecondary600 !bg-white border ml-2 py-[6px] px-[8px] w-[200px]"
				>
					<ItemStatus children="Online" startIcon={<Icons.OnlineStatus />} onClick={() => updateUserStatus('Online', 0, true)} />
					<div className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>
					<ItemStatusUpdate children="Idle" startIcon={<Icons.DarkModeIcon className="text-[#F0B232] -rotate-90" />} dropdown />
					<ItemStatusUpdate children="Do Not Disturb" startIcon={<Icons.MinusCircleIcon />} dropdown />
					<ItemStatusUpdate children="Invisible" startIcon={<Icons.OfflineStatus />} dropdown />
					<div className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>
				</Dropdown>
				<ItemStatus
					onClick={handleCustomStatus}
					children={`${userCustomStatus ? 'Edit' : 'Set'} Custom Status`}
					startIcon={<Icons.SmilingFace />}
				/>
			</div>
			<div className="w-full border-b-[1px] dark:border-[#40444b] border-gray-200 opacity-70 text-center"></div>
			<Dropdown
				trigger="click"
				dismissOnClick={true}
				renderTrigger={() => (
					<div>
						<ItemStatus children="Switch Accounts" dropdown startIcon={<Icons.ConvertAccount />} />
					</div>
				)}
				label=""
				placement="right-start"
				className="dark:!bg-[#232428] bg-white border-none ml-2 py-[6px] px-[8px] w-[100px]"
			>
				<ItemProfile avatar={user?.avatar_url} username={user?.username} />
				<div className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>
				<ItemStatus children="Manage Accounts" />
			</Dropdown>
			{isShowModalWithdraw && <SettingRightWithdraw onClose={handleCloseWithdrawModal} />}
			{isShowModalHistory && <HistoryTransaction onClose={handleCloseHistoryModal} />}
		</>
	);
};

export default StatusProfile;
