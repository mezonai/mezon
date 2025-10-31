import { AvatarImage } from '@mezon/components';
import { useAuth } from '@mezon/core';
import { selectCurrentClanName, selectMemberClanByUserId, useAppSelector } from '@mezon/store';
import { Button, ButtonLoading, Icons, Modal } from '@mezon/ui';
import type { ChannelMembersEntity } from '@mezon/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type TransferOwnerProps = {
	onClose: () => void;
	onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
	member: ChannelMembersEntity;
};
const TransferOwnerModal = ({ onClose, member, onClick }: TransferOwnerProps) => {
	const { t } = useTranslation('transferOwner');
	const { userProfile } = useAuth();
	const dataInClan = useAppSelector((state) => selectMemberClanByUserId(state, userProfile?.user?.id || ''));
	const currentClanName = useAppSelector(selectCurrentClanName);
	const [checkedTransfer, setCheckedTransfer] = useState(false);

	const handleCheckInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCheckedTransfer(e.target.checked);
	};

	const handleOnTransferOwner = () => {
		if (!checkedTransfer) {
			return;
		}
		onClick();
	};
	return (
		<Modal onClose={onClose} showModal title={t('title')}>
			<div className="flex flex-col gap-6 p-3 items-center text-theme-primary">
				<div className=" text-base ">
					{t('description', {
						clanName: currentClanName,
						memberName: member?.clan_nick || member.user?.display_name || member?.user?.username
					})}
				</div>
				<div className="flex gap-3">
					<div className="flex flex-col items-center justify-center gap-3 w-40 opacity-75">
						<AvatarImage
							username={dataInClan?.clan_nick || dataInClan.user?.display_name || dataInClan?.user?.username}
							srcImgProxy={dataInClan?.clan_avatar || dataInClan?.user?.avatar_url}
							src={dataInClan?.clan_avatar || dataInClan?.user?.avatar_url}
							alt="Avatar"
							className="w-20 h-20 rounded-full"
						/>
						<p className="text-lg font-semibold">
							{dataInClan?.clan_nick || dataInClan.user?.display_name || dataInClan?.user?.username}
						</p>
					</div>
					<div className="font-extrabold text-white text-3xl mt-6">
						<IconTransfer />
					</div>
					<div className="flex flex-col items-center justify-center gap-3 w-40 relative">
						<AvatarImage
							username={member?.clan_nick || member.user?.display_name || member?.user?.username}
							srcImgProxy={member?.clan_avatar || member?.user?.avatar_url}
							src={member?.clan_avatar || member?.user?.avatar_url}
							alt="Avatar"
							className="w-20 h-20 rounded-full"
						/>
						<p className="text-lg font-semibold">{member?.clan_nick || member.user?.display_name || member?.user?.username}</p>
						<Icons.OwnerIcon className="absolute -top-6 w-4 h-5" />
					</div>
				</div>

				<div className="text-sm text-center text-theme-primary">
					<input
						id="confirm-transfer"
						type="checkbox"
						checked={checkedTransfer}
						className="w-3 h-3 rounded-md pr-4"
						onChange={handleCheckInput}
					/>
					<label htmlFor="confirm-transfer" className="ml-2">
						{t('confirmation', { memberName: member?.clan_nick || member.user?.display_name || member?.user?.username })}
					</label>
				</div>

				<div className="flex gap-4">
					<ButtonLoading
						className="bg-[#da373c] text-white hover:bg-[#a12828] rounded-md px-4 py-2 cursor-pointer"
						onClick={handleOnTransferOwner}
						label={t('buttons.transfer')}
						disabled={!checkedTransfer}
					></ButtonLoading>
					<Button onClick={onClose} className="bg-bgSecondary px-4 py-2 rounded-md">
						{t('buttons.cancel')}
					</Button>
				</div>
			</div>
		</Modal>
	);
};
export default TransferOwnerModal;

const IconTransfer = () => {
	return (
		<svg height="60px" width="60px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
			<g>
				<path
					fill="currentColor"
					d="M46.002,31h-2c-0.552,0-1-0.447-1-1s0.448-1,1-1h2c0.552,0,1,0.447,1,1S46.554,31,46.002,31z
		 M40.002,31h-2c-0.552,0-1-0.447-1-1s0.448-1,1-1h2c0.552,0,1,0.447,1,1S40.554,31,40.002,31z M34.002,31h-2c-0.552,0-1-0.447-1-1
		s0.448-1,1-1h2c0.552,0,1,0.447,1,1S34.554,31,34.002,31z M28.002,31h-2c-0.552,0-1-0.447-1-1s0.448-1,1-1h2c0.552,0,1,0.447,1,1
		S28.554,31,28.002,31z M22.002,31h-2c-0.552,0-1-0.447-1-1s0.448-1,1-1h2c0.552,0,1,0.447,1,1S22.554,31,22.002,31z M16.002,31h-2
		c-0.552,0-1-0.447-1-1s0.448-1,1-1h2c0.552,0,1,0.447,1,1S16.554,31,16.002,31z M49.894,30.207c-0.389,0-0.758-0.228-0.92-0.608
		c-0.216-0.508,0.02-1.095,0.528-1.312c0.548-0.233,1.079-0.524,1.576-0.866c0.457-0.312,1.079-0.195,1.391,0.26
		c0.312,0.456,0.196,1.078-0.26,1.391c-0.606,0.415-1.253,0.771-1.922,1.056C50.158,30.182,50.025,30.207,49.894,30.207z
		 M54.411,26.395c-0.186,0-0.373-0.052-0.541-0.159c-0.464-0.3-0.598-0.918-0.299-1.383c0.325-0.504,0.601-1.043,0.82-1.6
		c0.202-0.515,0.781-0.767,1.296-0.565c0.514,0.202,0.767,0.782,0.565,1.296c-0.267,0.681-0.604,1.338-1,1.953
		C55.061,26.233,54.74,26.395,54.411,26.395z M55.997,20.704c-0.539,0-0.983-0.429-0.999-0.971c-0.018-0.6-0.096-1.198-0.232-1.781
		c-0.126-0.537,0.208-1.075,0.746-1.201c0.536-0.126,1.076,0.208,1.202,0.746c0.167,0.712,0.262,1.444,0.284,2.178
		c0.016,0.552-0.418,1.013-0.97,1.029C56.017,20.704,56.007,20.704,55.997,20.704z M54.077,15.118c-0.309,0-0.612-0.142-0.808-0.41
		c-0.353-0.482-0.757-0.934-1.201-1.34c-0.407-0.373-0.435-1.006-0.062-1.413c0.373-0.406,1.005-0.436,1.413-0.062
		c0.541,0.496,1.033,1.046,1.463,1.635c0.326,0.445,0.229,1.071-0.217,1.397C54.489,15.056,54.282,15.118,54.077,15.118z
		 M49.343,11.578c-0.112,0-0.225-0.019-0.336-0.059c-0.564-0.201-1.151-0.346-1.742-0.43c-0.547-0.077-0.927-0.584-0.85-1.131
		c0.078-0.547,0.586-0.924,1.13-0.85c0.725,0.103,1.443,0.28,2.134,0.527c0.52,0.186,0.791,0.758,0.605,1.277
		C50.139,11.323,49.754,11.578,49.343,11.578z M43.41,11h-2c-0.552,0-1-0.447-1-1s0.448-1,1-1h2c0.552,0,1,0.447,1,1
		S43.963,11,43.41,11z M37.41,11h-2c-0.552,0-1-0.447-1-1s0.448-1,1-1h2c0.552,0,1,0.447,1,1S37.963,11,37.41,11z M31.41,11h-2
		c-0.552,0-1-0.447-1-1s0.448-1,1-1h2c0.552,0,1,0.447,1,1S31.963,11,31.41,11z M25.41,11h-2c-0.552,0-1-0.447-1-1s0.448-1,1-1h2
		c0.552,0,1,0.447,1,1S25.963,11,25.41,11z M19.41,11h-2c-0.552,0-1-0.447-1-1s0.448-1,1-1h2c0.552,0,1,0.447,1,1
		S19.963,11,19.41,11z"
				/>
				<path
					fill="currentColor"
					d="M46.002,51h-32c-6.065,0-11-4.935-11-11s4.935-11,11-11c0.552,0,1,0.447,1,1s-0.448,1-1,1
		c-4.962,0-9,4.037-9,9s4.038,9,9,9h32c0.552,0,1,0.447,1,1S46.554,51,46.002,51z"
				/>
				<path
					fill="currentColor"
					d="M14.002,11c-0.256,0-0.512-0.098-0.707-0.293c-0.391-0.391-0.391-1.023,0-1.414l9-9
		c0.391-0.391,1.023-0.391,1.414,0s0.391,1.023,0,1.414l-9,9C14.514,10.902,14.258,11,14.002,11z"
				/>
				<path
					fill="currentColor"
					d="M23.002,20c-0.256,0-0.512-0.098-0.707-0.293l-9-9c-0.391-0.391-0.391-1.023,0-1.414
		s1.023-0.391,1.414,0l9,9c0.391,0.391,0.391,1.023,0,1.414C23.514,19.902,23.258,20,23.002,20z"
				/>
				<path
					fill="currentColor"
					d="M37.002,60c-0.256,0-0.512-0.098-0.707-0.293c-0.391-0.391-0.391-1.023,0-1.414l9-9
		c0.391-0.391,1.023-0.391,1.414,0s0.391,1.023,0,1.414l-9,9C37.514,59.902,37.258,60,37.002,60z"
				/>
				<path
					fill="currentColor"
					d="M46.002,51c-0.256,0-0.512-0.098-0.707-0.293l-9-9c-0.391-0.391-0.391-1.023,0-1.414
		s1.023-0.391,1.414,0l9,9c0.391,0.391,0.391,1.023,0,1.414C46.514,50.902,46.258,51,46.002,51z"
				/>
			</g>
		</svg>
	);
};
