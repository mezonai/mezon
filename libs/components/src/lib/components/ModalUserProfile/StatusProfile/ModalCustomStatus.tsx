import { channelMembersActions, selectCurrentClanId, useAppDispatch, userClanProfileActions } from '@mezon/store';
import { Icons, Menu } from '@mezon/ui';
import { ReactElement, ReactNode, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { ModalLayout } from '../../../components';

type ModalCustomStatusProps = {
	name: string;
	onClose: () => void;
	status?: string;
};

const ModalCustomStatus = ({ name, status, onClose }: ModalCustomStatusProps) => {
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(userClanProfileActions.setShowModalFooterProfile(false));
	}, []);

	const handleChangeCustomStatus = (e: React.ChangeEvent<HTMLInputElement>) => {
		const updatedStatus = e.target.value.slice(0, 128).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "''");
		setCustomStatus(updatedStatus);
	};

	const [timeSetReset, setTimeSetReset] = useState<string>('Today');

	const setStatusTimer = (minutes: number, noClear: boolean, option: string) => {
		setTimeSetReset(option);
		if (noClear) {
			setNoClearStatus(noClear);
		} else {
			if (option === 'Today') {
				const now = new Date();
				const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
				const timeDifference = endOfDay.getTime() - now.getTime();
				minutes = Math.floor(timeDifference / (1000 * 60));
			}
			setResetTimerStatus(minutes);
		}
	};
	const currentClanId = useSelector(selectCurrentClanId);

	const [resetTimerStatus, setResetTimerStatus] = useState<number>(0);
	const [noClearStatus, setNoClearStatus] = useState<boolean>(false);
	const [customStatus, setCustomStatus] = useState<string>(status ?? '');

	const handleSaveCustomStatus = () => {
		dispatch(
			channelMembersActions.updateCustomStatus({
				clanId: currentClanId ?? '',
				customStatus: customStatus || '',
				minutes: resetTimerStatus,
				noClear: noClearStatus
			})
		);
		dispatch(userClanProfileActions.setShowModalCustomStatus(false));
		onClose();
	};

	const menuTime = useMemo(() => {
		const menuItems: ReactElement[] = [
			<ItemSelect timeSetReset={timeSetReset} children="Today" onClick={() => setStatusTimer(0, false, 'Today')} />,
			<ItemSelect timeSetReset={timeSetReset} children="4 hours" onClick={() => setStatusTimer(240, false, '4 hours')} />,
			<ItemSelect timeSetReset={timeSetReset} children="1 hours" onClick={() => setStatusTimer(60, false, '1 hours')} />,
			<ItemSelect timeSetReset={timeSetReset} children="30 minutes" onClick={() => setStatusTimer(30, false, '30 minutes')} />,
			<ItemSelect timeSetReset={timeSetReset} children="Don't clear" onClick={() => setStatusTimer(0, true, "Don't clear")} />
		];
		return <>{menuItems}</>;
	}, [timeSetReset]);

	return (
		<ModalLayout onClose={onClose}>
			<div className="bg-theme-setting-primary pt-4 rounded w-[440px] ">
				<div>
					<h1 className="text-theme-primary-active text-xl font-semibold text-center">Set a custom status</h1>
				</div>
				<div className="flex w-full flex-col gap-5 pt-4">
					<div className="px-4">
						<div className="mb-2 block">
							<p className="text-theme-primary text-xs uppercase font-semibold">What's cookin', {name}</p>
						</div>
						<input
							type="text"
							defaultValue={customStatus}
							className="text-theme-primary bg-input-secondary outline-none w-full h-10 p-[10px] text-base rounded placeholder:text-sm border-theme-primary"
							placeholder="What on your mind?"
							maxLength={128}
							autoFocus
							onChange={handleChangeCustomStatus}
						/>
					</div>
					<div className="px-4">
						<div className="mb-2 block">
							<p className="text-theme-primary text-xs uppercase font-semibold">Clear after</p>
						</div>
						<Menu menu={menuTime} className="bg-[var(--theme-setting-primary)] border-none py-0 w-[200px] [&>ul]:py-0">
							<div className="flex items-center justify-between rounded-lg cursor-pointer h-9 text-theme-primary-hover bg-input-secondary px-3 text-theme-primary">
								<li className="text-[14px] text-theme-primary w-full py-[6px] list-none select-none">{timeSetReset}</li>
								<Icons.ArrowDown />
							</div>
						</Menu>
					</div>
					<div className="flex justify-end p-4 gap-2 rounded-b-theme-primary ">
						<button className="py-2 h-10 px-4 rounded-lg  hover:underline text-theme-primary" type="button" onClick={onClose}>
							Cancel
						</button>
						<button
							className="py-2 h-10 px-4 rounded-lg text-white !bg-[#5265ec] hover:!bg-[#4654c0]"
							type="button"
							onClick={handleSaveCustomStatus}
						>
							Save
						</button>
					</div>
				</div>
			</div>
		</ModalLayout>
	);
};

type ItemSelectProps = {
	children: string;
	dropdown?: boolean;
	startIcon?: ReactNode;
	onClick?: () => void;
	timeSetReset: string;
};

const ItemSelect = ({ children, dropdown, startIcon, onClick, timeSetReset }: ItemSelectProps) => {
	return (
		<div onClick={onClick} className="flex w-full items-center justify-between px-3 bg-item-hover cursor-pointer">
			{startIcon && <div className="flex items-center justify-center h-[18px] w-[18px] mr-2">{startIcon}</div>}
			<div>
				<li className="text-[14px] w-full list-none leading-[44px] ">{children}</li>
			</div>
			{children === timeSetReset && <Icons.Check className="w-[18px] h-[18px]" />}
		</div>
	);
};

export default ModalCustomStatus;
