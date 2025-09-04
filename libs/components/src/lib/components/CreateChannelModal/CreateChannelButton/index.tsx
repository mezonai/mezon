import { selectLoadingStatus } from '@mezon/store';
import { Loading } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { useSelector } from 'react-redux';

interface CreateChannelProps {
	checkInputError: boolean | undefined;
	onClickCancel: () => void;
	onClickCreate: () => void;
}

export const CreateChannelButton: React.FC<CreateChannelProps> = ({ checkInputError, onClickCancel, onClickCreate }) => {
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
				Cancel
			</button>

			<button
				disabled={isLoading === 'loading'}
				onClick={onClickCreate}
				className={`Text disabled:cursor-not-allowed text-xs leading-normal relative h-10 w-30 justify-center px-3 py-3 flex flex-row items-center gap-1 font-semibold rounded-lg btn-primary ${!(checkInputError === false) ? 'text-zinc-300 hover:bg-opacity-50' : 'btn-primary-hover text-white'}`}
				data-e2e={generateE2eId('clan_page.modal.create_channel.button.confirm')}
			>
				{isLoading === 'loading' ? (
					<>
						<Loading /> <span>Creating</span>
					</>
				) : (
					<span>Create Channel</span>
				)}
			</button>
		</div>
	);
};
