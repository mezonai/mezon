import { selectIsPrivate, threadsActions, useAppDispatch } from '@mezon/store';
import { generateE2eId } from '@mezon/utils';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

type PrivateThreadProps = {
	label?: string;
	title?: string;
};

const PrivateThread = ({ label, title }: PrivateThreadProps) => {
	const { t } = useTranslation('channelTopbar');
	const dispatch = useAppDispatch();
	const isPrivate = useSelector(selectIsPrivate);

	const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.checked ? 1 : 0;
		dispatch(threadsActions.setIsPrivate(value));
	};

	return (
		<div className="flex flex-col mt-4 mb-4">
			<span className="text-xs font-semibold uppercase mb-2 text-theme-primary-active">{title}</span>
			<div className="flex items-center gap-2">
				<input
					type="checkbox"
					checked={isPrivate === 1}
					onChange={handleToggle}
					id="private"
					className="w-6 h-6 rounded-lg focus:ring-transparent cursor-pointer"
					data-e2e={generateE2eId('chat.channel_message.thread_box.checkbox.private_thread')}
				/>
				<label htmlFor="private" className="text-theme-primary text-base hover:text-theme-primary cursor-pointer">
					{label}
				</label>
			</div>
			{isPrivate === 1 && <span className="text-xs text-theme-primary mt-2">{t('createThread.inviteMessage')}</span>}
		</div>
	);
};

export default PrivateThread;
