import { useAuth, useMemberCustomStatus } from '@mezon/core';
import { ChannelMembersEntity, giveCoffeeActions, selectUpdateToken, useAppDispatch, userClanProfileActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { Dropdown } from 'flowbite-react';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import ItemProfile from './ItemProfile';
import ItemStatus from './ItemStatus';

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
	const getTokenSocket = useSelector(selectUpdateToken(user?.id ?? ''));
	const { userProfile } = useAuth();
	const tokenInWallet = useMemo(() => {
		const parse = JSON.parse(userProfile?.wallet ?? '').value;
		return parse;
	}, [userProfile?.wallet]);

	const handleSendToken = () => {
		dispatch(giveCoffeeActions.setShowModalSendToken(true));
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
							<ItemStatus children={`Token: ${Number(tokenInWallet) + Number(getTokenSocket)}`} dropdown startIcon={<Icons.Check />} />
						</div>
					)}
					placement="right-start"
					className="dark:!bg-bgSecondary600 !bg-white border ml-2 py-[6px] px-[8px] w-[200px]"
				>
					<ItemStatus onClick={handleSendToken} children="Send Token" startIcon={<Icons.SendMoney />} />
				</Dropdown>
				<Dropdown
					trigger="click"
					dismissOnClick={true}
					renderTrigger={() => (
						<div>
							<ItemStatus children="Online" dropdown startIcon={<Icons.OnlineStatus />} />
						</div>
					)}
					label=""
					placement="right-start"
					className="dark:!bg-bgSecondary600 !bg-white border ml-2 py-[6px] px-[8px] w-[200px]"
				>
					<ItemStatus children="Online" startIcon={<Icons.OnlineStatus />} />
					<div className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>
					<ItemStatus children="Idle" startIcon={<Icons.DarkModeIcon className="text-[#F0B232] -rotate-90" />} />
					<ItemStatus children="Do Not Disturb" startIcon={<Icons.MinusCircleIcon />} />
					<ItemStatus children="Invisible" startIcon={<Icons.OfflineStatus />} />
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
		</>
	);
};

export default StatusProfile;
