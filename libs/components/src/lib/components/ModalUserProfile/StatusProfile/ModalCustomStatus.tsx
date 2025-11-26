import { channelMembersActions, selectCurrentClanId, useAppDispatch, userClanProfileActions } from '@mezon/store';
import { Icons, Menu } from '@mezon/ui';
import type { ReactElement, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ModalLayout } from '../../../components';

type ModalCustomStatusProps = {
	name: string;
	onClose: () => void;
	status?: string;
	time_reset?: number;
};

const ModalCustomStatus = ({ name, status, onClose, time_reset = 0 }: ModalCustomStatusProps) => {
	const { t } = useTranslation(['userProfile'], { keyPrefix: 'statusProfile.customStatusModal' });
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(userClanProfileActions.setShowModalFooterProfile(false));
	}, [dispatch]);

	const handleChangeCustomStatus = (e: React.ChangeEvent<HTMLInputElement>) => {
		const updatedStatus = e.target.value.slice(0, 128).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "''");
		setCustomStatus(updatedStatus);
	};

	function getTimeResetLabel(minutes: number, t: (key: string) => string): string {
		switch (minutes) {
			case 0:
				return t('timeOptions.today');
			case 240:
				return t('timeOptions.fourHours');
			case 60:
				return t('timeOptions.oneHour');
			case 30:
				return t('timeOptions.thirtyMinutes');

			default:
				return t('timeOptions.today');
		}
	}

	const [timeSetReset, setTimeSetReset] = useState<string>(getTimeResetLabel(time_reset, t));

	const setStatusTimer = useCallback(
		(minutes: number, noClear: boolean, option: string) => {
			setTimeSetReset(option);
			if (noClear) {
				setNoClearStatus(noClear);
			} else {
				if (option === t('timeOptions.today')) {
					const now = new Date();
					const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
					const timeDifference = endOfDay.getTime() - now.getTime();
					minutes = Math.floor(timeDifference / (1000 * 60));
				}
				setResetTimerStatus(minutes);
			}
		},
		[t]
	);
	const currentClanId = useSelector(selectCurrentClanId);

	const [resetTimerStatus, setResetTimerStatus] = useState<number>(time_reset);
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
			<ItemSelect
				key={'timeOptions.today'}
				timeSetReset={timeSetReset}
				children={t('timeOptions.today')}
				onClick={() => setStatusTimer(0, false, t('timeOptions.today'))}
			/>,
			<ItemSelect
				key={'timeOptions.fourHours'}
				timeSetReset={timeSetReset}
				children={t('timeOptions.fourHours')}
				onClick={() => setStatusTimer(240, false, t('timeOptions.fourHours'))}
			/>,
			<ItemSelect
				key={'timeOptions.oneHour'}
				timeSetReset={timeSetReset}
				children={t('timeOptions.oneHour')}
				onClick={() => setStatusTimer(60, false, t('timeOptions.oneHour'))}
			/>,
			<ItemSelect
				key={'timeOptions.thirtyMinutes'}
				timeSetReset={timeSetReset}
				children={t('timeOptions.thirtyMinutes')}
				onClick={() => setStatusTimer(30, false, t('timeOptions.thirtyMinutes'))}
			/>,
			<ItemSelect
				key={'timeOptions.dontClear'}
				timeSetReset={timeSetReset}
				children={t('timeOptions.dontClear')}
				onClick={() => setStatusTimer(0, true, t('timeOptions.dontClear'))}
			/>
		];
		return <div>{menuItems}</div>;
	}, [timeSetReset, t, setStatusTimer]);

	return (
		<ModalLayout onClose={onClose}>
			<div className="bg-theme-setting-primary pt-4 rounded w-[440px] ">
				<div>
					<h1 className="text-theme-primary-active text-xl font-semibold text-center">{t('title')}</h1>
				</div>
				<div className="flex w-full flex-col gap-5 pt-4">
					<div className="px-4">
						<div className="mb-2 block">
							<p className="text-theme-primary text-xs uppercase font-semibold">{t('whatsCookin', { name })}</p>
						</div>
						<input
							type="text"
							defaultValue={customStatus}
							className="text-theme-primary bg-input-secondary outline-none w-full h-10 p-[10px] text-base rounded placeholder:text-sm border-theme-primary"
							placeholder={t('placeholder')}
							maxLength={128}
							autoFocus
							onChange={handleChangeCustomStatus}
						/>
					</div>
					<div className="px-4">
						<div className="mb-2 block">
							<p className="text-theme-primary text-xs uppercase font-semibold">{t('clearAfter')}</p>
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
							{t('buttons.cancel')}
						</button>
						<button
							className="py-2 h-10 px-4 rounded-lg text-white !bg-[#5265ec] hover:!bg-[#4654c0]"
							type="button"
							onClick={handleSaveCustomStatus}
						>
							{t('buttons.save')}
						</button>
					</div>
				</div>
			</div>
		</ModalLayout>
	);
};

type ItemSelectProps = {
	children: string;
	startIcon?: ReactNode;
	onClick?: () => void;
	timeSetReset: string;
};

const ItemSelect = ({ children, startIcon, onClick, timeSetReset }: ItemSelectProps) => {
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
