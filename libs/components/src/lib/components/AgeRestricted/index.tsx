import { useAccount, useAppNavigation, useAuth } from '@mezon/core';
import { selectCurrentChannelId, selectCurrentClanId } from '@mezon/store';
import { Menu } from '@mezon/ui';
import { safeJSONParse } from 'mezon-js';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { ModalLayout } from '../../components';

const AgeRestricted = ({ closeAgeRestricted }: { closeAgeRestricted: () => void }) => {
	const { t } = useTranslation('ageRestricted');
	const currentChannelId = useSelector(selectCurrentChannelId);
	const [dob, setDob] = useState<string>('');
	const [selectedDay, setSelectedDay] = useState<number | null>(null);
	const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
	const [selectedYear, setSelectedYear] = useState<number | null>(null);
	const { userProfile } = useAuth();
	const { updateUser } = useAccount();
	const { navigate, toMembersPage } = useAppNavigation();
	const currentClanId = useSelector(selectCurrentClanId);
	const handleSubmit = async () => {
		await updateUser(
			userProfile?.user?.username || '',
			userProfile?.user?.avatar_url || '',
			userProfile?.user?.display_name || '',
			userProfile?.user?.about_me || '',
			new Date(dob).getTime() / 1000,
			userProfile?.logo || ''
		);
	};

	const handleCloseModal = () => {
		const link = toMembersPage(currentClanId as string);
		navigate(link);
	};

	const handleSaveChannelId = () => {
		const parsed = safeJSONParse(localStorage.getItem('agerestrictedchannelIds') || '[]');
		const channelIds = Array.isArray(parsed) ? parsed : [];
		if (!channelIds.includes(currentChannelId) && currentChannelId) {
			channelIds.push(currentChannelId);
		}
		closeAgeRestricted();
		localStorage.setItem('agerestrictedchannelIds', JSON.stringify(channelIds));
	};

	const days = useMemo(() => Array.from({ length: 31 }, (_, idx) => idx + 1), []);
	const months = useMemo(
		() => [
			{ value: 1, label: t('month.january', 'January') },
			{ value: 2, label: t('month.february', 'February') },
			{ value: 3, label: t('month.march', 'March') },
			{ value: 4, label: t('month.april', 'April') },
			{ value: 5, label: t('month.may', 'May') },
			{ value: 6, label: t('month.june', 'June') },
			{ value: 7, label: t('month.july', 'July') },
			{ value: 8, label: t('month.august', 'August') },
			{ value: 9, label: t('month.september', 'September') },
			{ value: 10, label: t('month.october', 'October') },
			{ value: 11, label: t('month.november', 'November') },
			{ value: 12, label: t('month.december', 'December') }
		],
		[t]
	);
	const years = useMemo(() => {
		const currentYear = new Date().getFullYear() - 1;
		const startYear = currentYear - 120;
		return Array.from({ length: currentYear - startYear + 1 }, (_, idx) => currentYear - idx);
	}, []);

	const updateDobFromParts = (year: number | null, month: number | null, day: number | null) => {
		if (!year || !month || !day) {
			setDob('');
			return;
		}

		const formattedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

		if (formattedDate.getUTCFullYear() !== year || formattedDate.getUTCMonth() !== month - 1 || formattedDate.getUTCDate() !== day) {
			setDob('');
			return;
		}

		setDob(formattedDate.toISOString());
	};

	const handleSelectDay = (day: number) => {
		setSelectedDay(day);
		updateDobFromParts(selectedYear, selectedMonth, day);
	};

	const handleSelectMonth = (month: number) => {
		setSelectedMonth(month);
		updateDobFromParts(selectedYear, month, selectedDay);
	};

	const handleSelectYear = (year: number) => {
		setSelectedYear(year);
		updateDobFromParts(year, selectedMonth, selectedDay);
	};

	const renderDropdown = (placeholder: string, value: string, menu: ReactElement) => {
		return (
			<Menu
				trigger="click"
				placement="bottomLeft"
				menu={<div className="bg-[#2f3746] border border-[#3d4656] rounded-lg shadow-lg text-[#d7deea]">{menu}</div>}
			>
				<div className="w-full">
					<div className="flex items-center justify-between px-4 py-3 rounded-md bg-[#2f3746] text-[#d7deea] border border-[#3d4656] cursor-pointer">
						<span className={`${value ? 'text-[#ffffff]' : 'text-[#d7deea]'}`}>{value || placeholder}</span>
						<svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</div>
				</div>
			</Menu>
		);
	};

	const [openModalConfirmAge, closeModalConfirmAge] = useModal(() => {
		return (
			<ModalLayout onClose={handleCloseModal}>
				<div className="bg-theme-setting-primary  pt-4 rounded flex flex-col items-center text-theme-primary w-[550px]">
					<img src={'/assets/images/cake.png'} alt="warning" width={200} height={200} />
					<div className="text-center ml-6 mr-6">
						<h2 className="text-2xl font-bold text-center mb-4 text-theme-primary-active">{t('confirmBirthdayTitle')}</h2>
						<p>{t('confirmBirthdayMessage')}</p>
					</div>
					<div className="w-9/10 flex flex-col gap-2 mt-5">
						<div className="text-left text-xs font-semibold text-theme-primary-active uppercase tracking-widest">
							{t('dateOfBirth', 'Date of birth')}
						</div>
						<div className="grid grid-cols-3 gap-3 pb-4">
							{renderDropdown(
								t('select', 'Day'),
								selectedDay ? selectedDay.toString() : '',
								<div className="p-2 max-h-[200px] overflow-y-auto customSmallScrollLightMode">
									{days.map((day) => (
										<Menu.Item key={day} onClick={() => handleSelectDay(day)} className="hover:bg-[#3c4658] cursor-pointer">
											{day}
										</Menu.Item>
									))}
								</div>
							)}
							{renderDropdown(
								t('select', 'Month'),
								selectedMonth ? months.find((m) => m.value === selectedMonth)?.label || '' : '',
								<div className="p-2 max-h-[200px] overflow-y-auto customSmallScrollLightMode">
									{months.map((month) => (
										<Menu.Item
											key={month.value}
											onClick={() => handleSelectMonth(month.value)}
											className="hover:bg-[#3c4658] cursor-pointer"
										>
											{month.label}
										</Menu.Item>
									))}
								</div>
							)}
							{renderDropdown(
								t('select', 'Year'),
								selectedYear ? selectedYear.toString() : '',
								<div className="p-2 max-h-[200px] overflow-y-auto customSmallScrollLightMode">
									{years.map((year) => (
										<Menu.Item key={year} onClick={() => handleSelectYear(year)} className="hover:bg-[#3c4658] cursor-pointer">
											{year}
										</Menu.Item>
									))}
								</div>
							)}
						</div>
					</div>
					<div className="flex space-x-4 mb-4 w-9/10">
						<button
							type="button"
							onClick={handleSubmit}
							disabled={!dob || dob === ''}
							className={`border-2 rounded-lg px-6 py-2 w-full ${
								!dob || dob === ''
									? 'border-gray-400 bg-gray-400 text-gray-600 cursor-not-allowed'
									: 'border-blue-600 bg-blue-600 text-white'
							}`}
						>
							{t('submit')}
						</button>
					</div>
				</div>
			</ModalLayout>
		);
	}, [days, dob, months, selectedDay, selectedMonth, selectedYear, years]);

	useEffect(() => {
		if (!userProfile?.user?.dob_seconds || userProfile?.user?.dob_seconds === 0) {
			openModalConfirmAge();
		} else {
			closeModalConfirmAge();
		}
	}, [closeModalConfirmAge, openModalConfirmAge, userProfile?.user?.dob_seconds]);

	return (
		<div>
			<div className="w-full h-full max-w-[100%] flex justify-center items-center text-theme-primary ">
				<div className="flex flex-col items-center">
					<img src={'/assets/images/warning.svg'} alt="warning" width={200} height={200} />

					<div className="text-center mt-4">
						<h1 className="text-3xl font-bold mb-2 text-theme-primary-active ">{t('title')}</h1>
						<p className="mb-4">{t('description')}</p>
					</div>

					<div className="flex space-x-4">
						<button className="border-2 border-theme-primary text-theme-primary-active rounded-lg px-6 py-2 y" onClick={handleCloseModal}>
							{t('nope')}
						</button>
						<button className="border-2 border-colorDanger text-white rounded-lg px-6 py-2 bg-colorDanger " onClick={handleSaveChannelId}>
							{t('continue')}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AgeRestricted;
