import { selectCurrentClanName } from '@mezon/store';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ModalLayout } from '../../components';

type ModalRemoveMemberClanProps = {
	username?: string;
	onClose: () => void;
	onRemoveMember: (value: string) => void;
};

const ModalRemoveMemberClan = ({ username, onClose, onRemoveMember }: ModalRemoveMemberClanProps) => {
	const { t } = useTranslation('modalControls');
	const [value, setValue] = useState<string>('');
	const currentClanName = useSelector(selectCurrentClanName);

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setValue(e.target.value);
	};

	const handleSave = () => {
		onRemoveMember(value);
		setValue('');
	};

	return (
		<ModalLayout onClose={onClose}>
			<div className="bg-theme-setting-primary pt-4 rounded w-[440px]">
				<div className="px-4">
					<h1 className="text-theme-primary-active text-xl font-semibold">
						{t('kickMember.title', { username, clanName: currentClanName || 'clan' })}
					</h1>
				</div>
				<div className="px-4">
					<div className="block">
						<p className="text-theme-primary text-base font-normal">
							{t('kickMember.description', { username, clanName: currentClanName || 'the clan' })}
						</p>
					</div>
				</div>
				<div className="px-4">
					<div className="mb-2 block">
						<p className="text-theme-primary text-xs uppercase font-semibold">{t('kickMember.reasonLabel')}</p>
					</div>
					<textarea
						rows={2}
						value={value ?? ''}
						onChange={handleChange}
						className="text-theme-primary-active outline-none w-full h-16 p-[10px] bg-input-theme text-base rounded placeholder:text-sm"
					/>
				</div>
				<div className="flex justify-end gap-3 p-4 rounded-b bg-theme-setting-nav">
					<button
						className="w-20 py-2.5 h-10 text-sm font-medium text-theme-primary-active dark:text-zinc-50 bg-bgTextarea dark:bg-gray-700 border border-color-theme hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 shadow-sm"
						type="button"
						onClick={onClose}
					>
						{t('buttons.cancel')}
					</button>
					<button
						onClick={handleSave}
						className="w-20 py-2.5 h-10 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:bg-red-700 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 shadow-sm hover:shadow-md"
					>
						{t('buttons.kick')}
					</button>
				</div>
			</div>
		</ModalLayout>
	);
};

export default ModalRemoveMemberClan;
