import { selectCurrentClanName } from '@mezon/store';
import { generateE2eId } from '@mezon/utils';
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
				<div className="px-4 mb-3">
					<h1 className="text-theme-primary-active text-xl font-semibold flex flex-wrap items-center gap-1">
						<span>{t('kickMember.title').split('{')[0]}</span>
						<span className="text-theme-primary-active font-bold inline-block truncate max-w-[200px]" title={username}>
							{username}
						</span>
						<span>{t('kickMember.title').includes('from') ? 'from' : ''}</span>
						<span className="text-theme-primary-active font-bold inline-block truncate max-w-[150px]" title={currentClanName || 'clan'}>
							{currentClanName || 'clan'}
						</span>
					</h1>
				</div>
				<div className="px-4 mb-4">
					<div className="block">
						<p className="text-theme-primary text-base font-normal flex flex-wrap items-center gap-1">
							<span>{t('kickMember.description').split('{')[0]}</span>
							<span className="text-theme-primary-active font-semibold inline-block truncate max-w-[150px]" title={username}>
								{username}
							</span>
							<span>{t('kickMember.description').includes('from') ? 'from' : ''}</span>
							<span
								className="text-theme-primary-active font-semibold inline-block truncate max-w-[150px]"
								title={currentClanName || 'the clan'}
							>
								{currentClanName || 'the clan'}
							</span>
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
						data-e2e={generateE2eId('clan_page.modal.kick_member.reason_input')}
					/>
				</div>
				<div className="flex justify-end gap-3 p-4 rounded-b bg-theme-setting-nav">
					<button
						className="w-20 py-2.5 h-10 text-sm font-medium text-theme-primary-active dark:text-zinc-50 bg-bgTextarea dark:bg-gray-700 border border-color-theme hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 shadow-sm"
						type="button"
						onClick={onClose}
						data-e2e={generateE2eId('clan_page.modal.kick_member.button.cancel')}
					>
						{t('buttons.cancel')}
					</button>
					<button
						onClick={handleSave}
						className="w-20 py-2.5 h-10 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:bg-red-700 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 shadow-sm hover:shadow-md"
						data-e2e={generateE2eId('clan_page.modal.kick_member.button.kick')}
					>
						{t('buttons.kick')}
					</button>
				</div>
			</div>
		</ModalLayout>
	);
};

export default ModalRemoveMemberClan;
