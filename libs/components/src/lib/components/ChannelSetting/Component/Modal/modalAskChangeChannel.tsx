import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { useTranslation } from 'react-i18next';

export type ModalAskChangeChannelProps = {
	onReset: () => void;
	onSave: () => void;
	/** A save is in flight: both buttons stay disabled until it lands. */
	isSaving?: boolean;
};

const SAVE_BAR_SHADOW = { boxShadow: '0 2px 10px 0 hsl(0 calc( 1 * 0%) 0% / 0.1)' };

/**
 * Floating like the overview tab's save bar, outside the settings scroll view, so paging or
 * scrolling a long member list never moves it out of reach.
 */
const ModalAskChangeChannel = (props: ModalAskChangeChannelProps) => {
	const { onReset, onSave, isSaving = false } = props;
	const { t } = useTranslation('channelSetting');

	return (
		<div
			className="w-fit min-w-[700px] max-md:min-w-[90%] fixed bottom-[20px] left-[50%] translate-x-[-50%] py-[10px] pl-4 pr-[10px] rounded-[5px] dark:bg-bgProfileBody bg-white text-black dark:text-white text-sm font-medium z-50"
			style={SAVE_BAR_SHADOW}
		>
			<div className="flex flex-row justify-between items-center gap-4">
				<p className="text-[15px]">{t('unsavedChanges.warning')}</p>
				<div className="flex flex-row justify-end gap-[20px]">
					<button
						className="rounded px-4 py-1.5 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
						onClick={onReset}
						disabled={isSaving}
						data-e2e={generateE2eId('channel_setting_page.permissions.modal.ask_change.button.reset')}
					>
						{t('unsavedChanges.reset')}
					</button>
					<button
						className="min-w-[120px] rounded-lg px-4 py-1.5 text-nowrap bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
						onClick={onSave}
						disabled={isSaving}
						data-e2e={generateE2eId('channel_setting_page.permissions.modal.ask_change.button.save_changes')}
					>
						{isSaving ? <Icons.IconLoadingTyping bgFill="mx-auto" /> : t('unsavedChanges.saveChanges')}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ModalAskChangeChannel;
