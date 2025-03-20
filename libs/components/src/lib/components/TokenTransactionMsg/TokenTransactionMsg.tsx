import { MessagesEntity } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useState } from 'react';
import HistoryTransaction from '../HistoryTransaction';

interface ITokenTransactionMessageProps {
	message: MessagesEntity;
}

const TokenTransactionMessage = ({ message }: ITokenTransactionMessageProps) => {
	const transactionData = message?.content?.t ?? '';
	const [title, ...rest] = transactionData.split(' | ');
	const description = rest.join(' | ');
	const [isShowModalHistory, setIsShowModalHistory] = useState<boolean>(false);
	const handleToggleHistoryModal = () => {
		setIsShowModalHistory(!isShowModalHistory);
	};
	return (
		<>
			<div className="py-2 w-full">
				<div className="w-[300px] border dark:border-borderDivider rounded-md dark:bg-bgSecondary bg-bgLightSecondary text-[#4E5057] dark:text-[#E6E6E6]">
					<div className="p-3 flex gap-2 border-b dark:border-borderDivider w-full">
						<div className="w-[50px]">
							<Icons.Transaction className="w-full dark:text-green-600 text-green-700" />
						</div>
						<div className="flex flex-col gap-2 flex-1">
							<div className="font-semibold ">{title}</div>
							<div className="text-xs font-medium ">
								<span className="dark:text-blue-500 text-blue-600">Detail: </span>
								{description}
							</div>
						</div>
					</div>
					<div className="p-3 flex justify-center">
						<div onClick={handleToggleHistoryModal} className="cursor-pointer dark:text-blue-500 text-blue-600 font-semibold text-[15px]">
							Mezon transfer
						</div>
					</div>
				</div>
			</div>
			{isShowModalHistory && <HistoryTransaction onClose={handleToggleHistoryModal} />}
		</>
	);
};

export default TokenTransactionMessage;
