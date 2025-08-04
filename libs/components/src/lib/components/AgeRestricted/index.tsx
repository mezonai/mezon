import { useAccount, useAppNavigation, useAuth } from '@mezon/core';
import { selectCurrentChannelId, selectCurrentClanId } from '@mezon/store';
import { safeJSONParse } from 'mezon-js';
import { useEffect, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { ModalLayout } from '../../components';

const AgeRestricted = ({ closeAgeRestricted }: { closeAgeRestricted: () => void }) => {
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
		const [year, month, day] = dateValue.split('-');
		const formattedDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0));
		const isoFormattedDate = formattedDate.toISOString();
		setDob(isoFormattedDate);
	};

	const [openModalConfirmAge, closeModalConfirmAge] = useModal(() => {
		return (
			<ModalLayout onClose={handleCloseModal}>
				<div className="bg-theme-setting-primary  pt-4 rounded flex flex-col items-center text-theme-primary w-[550px]">
					<img src={'assets/images/cake.png'} alt="warning" width={200} height={200} />
					<div className="text-center ml-6 mr-6">
						<h2 className="text-2xl font-bold text-center mb-4 text-theme-primary-active">Please confirm your birthday</h2>
						<p> To keep our users safe, we need to verify your age. We will only ask you for this once.</p>
					</div>
					<input
						type="date"
						id="birthday"
						onChange={handleBirthdayChange}
						className="mb-4 px-4 py-2 mt-5 border-2 border-color-theme text-theme-message rounded-lg bg-input-secondary w-9/10"
					/>
					<div className="flex space-x-4 mb-4 w-9/10">
						<button
							type="button"
							onClick={handleSubmit}
							className="border-2 border-blue-600 rounded-lg px-6 py-2 bg-blue-600 text-white w-full"
						>
							Submit
						</button>
					</div>
				</div>
			</ModalLayout>
		);
	}, []);

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
					<img src={'assets/images/warning.svg'} alt="warning" width={200} height={200} />

					<div className="text-center mt-4">
						<h1 className="text-3xl font-bold mb-2 text-theme-primary-active ">Age-Restricted Channel</h1>
						<p className="mb-4">This channel contains adult content marked as age-restricted. Do you wish to proceed?</p>
					</div>

					<div className="flex space-x-4">
						<button className="border-2 border-theme-primary text-theme-primary-active rounded-lg px-6 py-2 y" onClick={handleCloseModal}>
							Nope
						</button>
						<button className="border-2 border-colorDanger text-white rounded-lg px-6 py-2 bg-colorDanger " onClick={handleSaveChannelId}>
							Continue
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AgeRestricted;
