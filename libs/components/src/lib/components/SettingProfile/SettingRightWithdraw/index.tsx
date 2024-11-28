import { useAppParams, useAuth, useUserById } from '@mezon/core';
import { ChannelMembersEntity, selectDmGroupCurrent, selectUpdateToken } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import HistoriesWithdraw from './HistoriesWithdraw';
import WithDrawModal from './WithdrawModal';

const SettingRightWithdraw = () => {
	const { directId } = useAppParams();
	const currentDmGroup = useSelector(selectDmGroupCurrent(directId ?? ''));
	const [openModalWithdraw, setOpenModelWithdraw] = useState<boolean>(false);
	const userID = Array.isArray(currentDmGroup?.user_id) ? currentDmGroup?.user_id[0] : currentDmGroup?.user_id;
	const userById: ChannelMembersEntity | undefined = useUserById(userID);
	const [showCoin, setShowCoin] = useState<boolean>(false);
	const getTokenSocket = useSelector(selectUpdateToken(userById?.id ?? ''));
	const { userProfile } = useAuth();
	const [refreshHistory, setRefreshHistory] = useState(false);
	const tokenInWallet = useMemo(() => {
		try {
			return JSON.parse(userProfile?.wallet ?? '{}').value;
		} catch (error) {
			console.error('Error parsing wallet JSON:', error);
			return null;
		}
	}, [userProfile?.wallet, refreshHistory]);
	const userId = userProfile?.user?.id;

	const toggleVisibility = () => {
		setShowCoin(!showCoin);
	};

	const closeModal = () => {
		setOpenModelWithdraw(false);
		setRefreshHistory((prev) => !prev);
	};

	const openModal = () => {
		setOpenModelWithdraw(true);
	};

	const totalToken = useMemo(() => {
		return Number(tokenInWallet) + Number(getTokenSocket);
	}, [userProfile?.wallet]);

	const handleRefetch = () => {
		setRefreshHistory((prev) => !prev);
	};
	return (
		<div className="flex gap-8 flex-1 z-0">
			{openModalWithdraw && <WithDrawModal userId={userId} onClose={closeModal} totalToken={totalToken} onRefetch={handleRefetch} />}
			<div className="flex flex-1 flex-col gap-8">
				<div className="flex z-0 gap-x-8 flex-col ">
					<div className="flex gap-2">
						<p className="font-semibold tracking-wide text-sm">ESTIMATED BALANCE</p>
						<button onClick={toggleVisibility} className="outline-none z-50 fill-current cursor-pointer left-0  ">
							{showCoin ? (
								<Icons.EyeOpen className="w-5 h-5 text-borderFocus hover:text-white " />
							) : (
								<Icons.EyeClose className="w-5 h-5 text-borderFocus hover:text-white " />
							)}
						</button>
					</div>

					<div className="dark:bg-black bg-[#f0f0f0] mt-[10px]  rounded-lg flex flex-col relative p-3 gap-8 ">
						<div className="flex items-center flex-row gap-2 flex-1 justify-between ">
							<div className="flex items-center flex-row gap-2">
								<p className="text-2xl text-center">{!showCoin ? <span>*******</span> : ` ${totalToken} Token`}</p>
							</div>
							<button className="text-[15px] bg-gray-600 rounded-[4px] p-[8px] cursor-pointer hover:bg-opacity-80" onClick={openModal}>
								Withdraw
							</button>
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-2  w-full rounded-lg  bottom-4  h-fit  z-10">
					<p className="font-semibold tracking-wide text-sm">ORDER HISTORY</p>

					<div className="dark:bg-black bg-[#f0f0f0] mt-[10px]  rounded-lg flex flex-col relative p-3 gap-8">
						<HistoriesWithdraw userId={userId} onRefresh={refreshHistory} />
					</div>
				</div>
			</div>
		</div>
	);
};

export default SettingRightWithdraw;
