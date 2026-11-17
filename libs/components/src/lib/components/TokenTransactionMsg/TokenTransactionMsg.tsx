import type { MessagesEntity } from '@mezon/store';
import { MezonIcon, MzIcons48 } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { useModal } from 'react-modal-hook';
import TransactionHistory from '../TransactionHistory';

interface ITokenTransactionMessageProps {
	message: MessagesEntity;
}

const TokenTransactionMessage = ({ message }: ITokenTransactionMessageProps) => {
	const transactionData = message?.content?.t ?? '';
	const [title, ...rest] = transactionData.split(' | ');
	const description = rest.join(' | ');
	const [openModalHistory, closeModalHistory] = useModal(() => {
		return <TransactionHistory onClose={closeModalHistory} />;
	});
	return (
		<div className="py-2 w-full min-w-0">
			<div className="w-[360px] max-w-full overflow-hidden border-theme-primary rounded-md text-theme-primary-dark bg-theme-setting-primary shadow-sm">
				<div className="px-3 py-3.5 flex items-start gap-2.5 w-full">
					<MezonIcon icon={MzIcons48.mzTransaction} className="shrink-0 dark:text-green-600 text-green-700" />
					<div className="flex min-w-0 flex-col gap-2 flex-1">
						<div
							className="text-base font-semibold text-theme-primary-active [overflow-wrap:anywhere]"
							data-e2e={generateE2eId('send_token.message.title')}
						>
							{title}
						</div>
						<div className="flex min-w-0 items-center text-xs font-medium">
							<span className="shrink-0 dark:text-blue-500 text-blue-600 mr-1">Detail:</span>
							<span
								title={description}
								className="min-w-0 truncate font-semibold text-theme-primary-active"
								data-e2e={generateE2eId('send_token.message.detail')}
							>
								{description}
							</span>
						</div>
					</div>
				</div>
				<div className="px-3 py-3.5 flex justify-center bg-theme-setting-nav">
					<div
						onClick={openModalHistory}
						className="cursor-pointer dark:text-blue-500 text-blue-600 font-semibold text-sm"
						data-e2e={generateE2eId('send_token.message.button.open_history')}
					>
						Mezon transfer
					</div>
				</div>
			</div>
		</div>
	);
};

export default TokenTransactionMessage;
