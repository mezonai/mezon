import { useAccount, useAppNavigation, useAuth } from '@mezon/core';
import { selectCurrentChannelId, selectCurrentClanId } from '@mezon/store';
import { safeJSONParse } from 'mezon-js';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { ModalLayout } from '../../components';

const AgeRestricted = ({ closeAgeRestricted }: { closeAgeRestricted: () => void }) => {
	const { t } = useTranslation('ageRestricted');
	const currentChannelId = useSelector(selectCurrentChannelId);
	const [dob, setDob] = useState<string>('');
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
		const channelIds = safeJSONParse(localStorage.getItem('agerestrictedchannelIds') || '[]');
		if (!channelIds.includes(currentChannelId) && currentChannelId) {
			channelIds.push(currentChannelId);
		}
		closeAgeRestricted();
		localStorage.setItem('agerestrictedchannelIds', JSON.stringify(channelIds));
	};

	const handleBirthdayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const dateValue = event.target.value;

		if (!dateValue) {
			setDob('');
			return;
		}

		const [year, month, day] = dateValue.split('-');
		const yearNum = Number(year);
		const currentYear = new Date().getFullYear();

		const isCompleteDate = year && month && day && year.length === 4 && month.length === 2 && day.length === 2;

		if (!isCompleteDate) {
			return;
		}

		const isYearStartingWithZero = year.startsWith('0') && yearNum < 1000;

		if (year.length !== 4 || isNaN(yearNum) || !Number.isInteger(yearNum) || isYearStartingWithZero || yearNum > currentYear) {
			return;
		}

		const monthNum = Number(month);
		const dayNum = Number(day);

		if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
			return;
		}

		if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
			return;
		}

		const formattedDate = new Date(Date.UTC(yearNum, Number(month) - 1, Number(day), 0, 0, 0));

		if (
			formattedDate.getUTCFullYear() !== yearNum ||
			formattedDate.getUTCMonth() !== Number(month) - 1 ||
			formattedDate.getUTCDate() !== Number(day)
		) {
			return;
		}

		const isoFormattedDate = formattedDate.toISOString();
		setDob(isoFormattedDate);
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
					<input
						type="date"
						id="birthday"
						max={new Date().toISOString().split('T')[0]}
						onChange={handleBirthdayChange}
						onKeyDown={(e) => {
							if (e.key !== 'Tab' && e.key !== 'Escape' && e.key !== 'Enter' && !e.key.startsWith('Arrow')) {
								e.preventDefault();
							}
						}}
						onPaste={(e) => e.preventDefault()}
						className="mb-4 px-4 py-2 mt-5 border-2 border-color-theme text-theme-message rounded-lg bg-input-secondary w-9/10"
					/>
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
	}, [dob]);

	useEffect(() => {
		if (!userProfile?.user?.dob || userProfile?.user?.dob === '0001-01-01T00:00:00Z') {
			openModalConfirmAge();
		} else {
			closeModalConfirmAge();
		}
	}, [userProfile?.user?.dob]);

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
