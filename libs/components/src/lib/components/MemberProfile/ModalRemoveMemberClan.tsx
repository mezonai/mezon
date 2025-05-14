import { Label, Modal } from 'flowbite-react';
import { useState } from 'react';

type ModalRemoveMemberClanProps = {
	openModal: boolean;
	username?: string;
	onClose: () => void;
	onRemoveMember: (value: string) => void;
};

const ModalRemoveMemberClan = ({ openModal, username, onClose, onRemoveMember }: ModalRemoveMemberClanProps) => {
	const [value, setValue] = useState<string>('');

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setValue(e.target.value);
	};

	const handleSave = () => {
		onRemoveMember(value);
		setValue('');
	};

	return (
		<Modal
			className="dark:bg-bgModalDark bg-bgModalLight"
			theme={{ content: { base: 'w-[440px]' } }}
			show={openModal}
			dismissible={true}
			onClose={onClose}
		>
			<div className="dark:bg-bgPrimary bg-white pt-4 rounded">
				<div className="px-4">
					<h1 className="dark:text-white text-textLightTheme text-xl font-semibold">{`Kick ${username} from Clan`}</h1>
				</div>
				<form className="flex w-full flex-col gap-5 pt-4">
					<div className="px-4">
						<div className="block">
							<p className="dark:text-[#B5BAC1] text-textPrimaryLight text-base font-normal">{`Are you sure you want to kick @${username} from the clan? They will be able to rejoin again with a new invite.`}</p>
						</div>
					</div>
					<div className="px-4">
						<div className="mb-2 block">
							<Label value="Reason for Kick" className="dark:text-[#B5BAC1] text-buttonProfile text-xs uppercase font-semibold" />
						</div>
						<textarea
							rows={2}
							value={value ?? ''}
							onChange={handleChange}
							className="text-[#B5BAC1] outline-none w-full h-16 p-[10px] dark:bg-bgInputDark bg-bgTextarea text-base rounded placeholder:text-sm"
						/>
					</div>

					<div className="flex justify-end p-4 rounded-b dark:bg-[#2B2D31] bg-bgLightSecondary">
						<button
							className="py-2 dark:text-textDarkTheme text-channelTextareaLight h-10 px-4 rounded bg-transparent dark:bg-transparent hover:!bg-transparent hover:!underline focus:!ring-transparent"
							type="button"
							onClick={onClose}
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className="py-2 h-10 px-4 rounded bg-colorDanger hover:!bg-colorDangerHover dark:bg-colorDanger dark:hover:!bg-colorDangerHover focus:!ring-transparent"
						>
							Save
						</button>
					</div>
				</form>
			</div>
		</Modal>
	);
};

export default ModalRemoveMemberClan;
