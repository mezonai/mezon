import { useAccount, useAppNavigation, useAuth } from '@mezon/core';
import { selectCurrentChannelId, selectCurrentClanId } from '@mezon/store';
import { safeJSONParse } from 'mezon-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { ModalLayout } from '../../components';

type DropdownOption = { value: string; label: string };

const ChevronDown = () => (
	<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
		<path fill="#d1d5db" d="M6 9L1 4h10z" />
	</svg>
);

const DropdownSelect = ({
	value,
	onChange,
	options,
	placeholder = 'Select',
	menuMaxHeightPx = 200
}: {
	value: string;
	onChange: (val: string) => void;
	options: DropdownOption[];
	placeholder?: string;
	menuMaxHeightPx?: number;
}) => {
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!open) return;
		const onDocMouseDown = (e: MouseEvent) => {
			const el = wrapperRef.current;
			if (!el) return;
			if (!el.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('mousedown', onDocMouseDown);
		return () => document.removeEventListener('mousedown', onDocMouseDown);
	}, [open]);

	const selectedLabel = useMemo(() => {
		const found = options.find((o) => o.value === value);
		return found?.label ?? '';
	}, [options, value]);

	return (
		<div ref={wrapperRef} className="relative">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded border border-gray-600 cursor-pointer focus:outline-none focus:border-gray-500 text-left flex items-center justify-between gap-2"
			>
				<span className={selectedLabel ? 'text-gray-300' : 'text-gray-400'}>{selectedLabel || placeholder}</span>
				<span className="shrink-0">
					<ChevronDown />
				</span>
			</button>

			{open && (
				<div
					className="absolute z-50 mt-1 w-full rounded border border-gray-600 bg-gray-700 shadow-lg overflow-y-auto scrollbar-thin scrollbar-thumb-[#aab3c5] scrollbar-track-transparent"
					style={{ maxHeight: `${menuMaxHeightPx}px`, scrollbarWidth: 'thin', scrollbarColor: '#aab3c5 transparent' }}
				>
					{options.map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => {
								onChange(opt.value);
								setOpen(false);
							}}
							className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-600"
						>
							{opt.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
};

const AgeRestricted = ({ closeAgeRestricted }: { closeAgeRestricted: () => void }) => {
	const { t } = useTranslation('ageRestricted');
	const currentChannelId = useSelector(selectCurrentChannelId);
	const [dob, setDob] = useState<string>('');
	const [selectedDay, setSelectedDay] = useState<string>('');
	const [selectedMonth, setSelectedMonth] = useState<string>('');
	const [selectedYear, setSelectedYear] = useState<string>('');
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
			dob,
			userProfile?.logo || ''
		);
	};

	const handleCloseModal = () => {
		const link = toMembersPage(currentClanId as string);
		navigate(link);
	};

	const handleSaveChannelId = () => {
		let channelIds = safeJSONParse(localStorage.getItem('agerestrictedchannelIds') || '[]');

		if (!Array.isArray(channelIds)) {
			channelIds = [];
		}

		if (!channelIds.includes(currentChannelId) && currentChannelId) {
			channelIds.push(currentChannelId);
		}
		closeAgeRestricted();
		localStorage.setItem('agerestrictedchannelIds', JSON.stringify(channelIds));
	};

	useEffect(() => {
		if (!selectedDay || !selectedMonth || !selectedYear) {
			setDob('');
			return;
		}

		const yearNum = Number(selectedYear);
		const monthNum = Number(selectedMonth);
		const dayNum = Number(selectedDay);
		const currentYear = new Date().getFullYear();

		if (!Number.isInteger(yearNum) || selectedYear.length !== 4 || yearNum > currentYear) {
			setDob('');
			return;
		}

		if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
			setDob('');
			return;
		}

		if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31) {
			setDob('');
			return;
		}

		const formattedDate = new Date(Date.UTC(yearNum, monthNum - 1, dayNum, 0, 0, 0));

		if (formattedDate.getUTCFullYear() !== yearNum || formattedDate.getUTCMonth() !== monthNum - 1 || formattedDate.getUTCDate() !== dayNum) {
			setDob('');
			return;
		}

		setDob(formattedDate.toISOString());
	}, [selectedDay, selectedMonth, selectedYear]);

	const days = useMemo(() => Array.from({ length: 31 }, (_, i) => String(i + 1)), []);
	const months = useMemo<DropdownOption[]>(
		() => [
			{ value: '1', label: 'January' },
			{ value: '2', label: 'February' },
			{ value: '3', label: 'March' },
			{ value: '4', label: 'April' },
			{ value: '5', label: 'May' },
			{ value: '6', label: 'June' },
			{ value: '7', label: 'July' },
			{ value: '8', label: 'August' },
			{ value: '9', label: 'September' },
			{ value: '10', label: 'October' },
			{ value: '11', label: 'November' },
			{ value: '12', label: 'December' }
		],
		[]
	);
	const currentYear = new Date().getFullYear();
	const years = useMemo(() => Array.from({ length: 120 }, (_, i) => String(currentYear - i)), [currentYear]);

	const dayOptions = useMemo<DropdownOption[]>(() => days.map((d) => ({ value: d, label: d })), [days]);
	const yearOptions = useMemo<DropdownOption[]>(() => years.map((y) => ({ value: y, label: y })), [years]);

	const [openModalConfirmAge, closeModalConfirmAge] = useModal(() => {
		return (
			<ModalLayout onClose={handleCloseModal}>
				<div className="bg-theme-setting-primary  pt-4 rounded flex flex-col items-center text-theme-primary w-[550px]">
					<img src={'/assets/images/cake.png'} alt="warning" width={200} height={200} />
					<div className="text-center ml-6 mr-6">
						<h2 className="text-2xl font-bold text-center mb-4 text-theme-primary-active">{t('confirmBirthdayTitle')}</h2>
						<p>{t('confirmBirthdayMessage')}</p>
					</div>
					<div className="mb-4 mt-5 w-9/10">
						<label className="block text-xs uppercase text-gray-400 mb-2 text-left">DATE OF BIRTH</label>
						<div className="flex gap-2">
							<div className="flex-1">
								<DropdownSelect
									value={selectedDay}
									onChange={setSelectedDay}
									options={dayOptions}
									menuMaxHeightPx={200}
									placeholder="Day"
								/>
							</div>
							<div className="flex-1">
								<DropdownSelect
									value={selectedMonth}
									onChange={setSelectedMonth}
									options={months}
									menuMaxHeightPx={200}
									placeholder="Month"
								/>
							</div>
							<div className="flex-1">
								<DropdownSelect
									value={selectedYear}
									onChange={setSelectedYear}
									options={yearOptions}
									menuMaxHeightPx={200}
									placeholder="Year"
								/>
							</div>
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
	}, [dob, selectedDay, selectedMonth, selectedYear, dayOptions, months, yearOptions, handleCloseModal, handleSubmit]);

	useEffect(() => {
		if (!userProfile?.user?.dob || userProfile?.user?.dob === '0001-01-01T00:00:00Z') {
			openModalConfirmAge();
		} else {
			closeModalConfirmAge();
		}
	}, [userProfile?.user?.dob, openModalConfirmAge, closeModalConfirmAge]);

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
