import { AvatarImage } from '@mezon/components';
import { useAuth } from '@mezon/core';
import { selectCurrentClanName, selectMemberClanByUserId, useAppSelector } from '@mezon/store';
import { Button, ButtonLoading, MezonIcon, Modal, MzIcons16, MzIcons48 } from '@mezon/ui';
import { generateE2eId, type ChannelMembersEntity } from '@mezon/utils';
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
			<div
				className="flex flex-col gap-6 p-3 items-center text-theme-primary"
				data-e2e={generateE2eId('clan_page.member_list.transfer_owner_modal')}
			>
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
						<MezonIcon icon={MzIcons16.mzOwner} className="absolute -top-6 text-[#F0B132]" />
					</div>
				</div>

				<div className="text-sm text-center text-theme-primary">
					<input
						id="confirm-transfer"
						type="checkbox"
						checked={checkedTransfer}
						className="w-3 h-3 rounded-md pr-4"
						onChange={handleCheckInput}
						data-e2e={generateE2eId('clan_page.member_list.transfer_owner_modal.input.confirm_transfer')}
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
	return <MezonIcon icon={MzIcons48.mzOwnerTransfer} className="!w-[60px] !h-[60px]" />;
};
