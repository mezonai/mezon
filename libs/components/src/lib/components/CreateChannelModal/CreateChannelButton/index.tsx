import { selectLoadingStatus } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

interface CreateChannelProps {
	checkInputError: boolean | undefined;
	onClickCancel: () => void;
	onClickCreate: () => void;
}

export const CreateChannelButton: React.FC<CreateChannelProps> = ({ checkInputError, onClickCancel, onClickCreate }) => {
	const { t } = useTranslation('createChannel');
	const isLoading = useSelector(selectLoadingStatus);
	return (
		<div
			className="Frame394 absolute border-t-theme-primary  self-stretch mb-0 pt-3 justify-end items-center gap-4 inline-flex bottom-5 right-5"
			style={{
				width: 'calc(100% - 40px)'
			}}
		>
			<button
				onClick={onClickCancel}
				className="Text  px-4 py-2 rounded-lg hover:underline text-xs leading-normal font-semibold"
				data-e2e={generateE2eId('clan_page.modal.create_channel.button.cancel')}
			>
				{t('buttons.cancel')}
			</button>

			{isLoading === 'loading' ? (
				<div className="flex flex-row items-center gap-2 px-3 py-3 text-xs font-semibold text-zinc-400">
					<Icons.LoadingSpinner className="w-4 h-4 fill-white" />
					<span>{t('buttons.creating')}</span>
				</div>
			) : (
				<button
					onClick={onClickCreate}
					className={`Text text-xs leading-normal relative h-10 w-30 justify-center px-3 py-3 flex flex-row items-center gap-1 font-semibold rounded-lg btn-primary ${!(checkInputError === false) ? 'text-zinc-300 hover:bg-opacity-50' : 'btn-primary-hover text-white'}`}
					data-e2e={generateE2eId('clan_page.modal.create_channel.button.confirm')}
				>
					<span>{t('buttons.create')}</span>
				</button>
			)}
		</div>
	);
};
