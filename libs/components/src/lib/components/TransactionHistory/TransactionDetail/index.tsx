import { selectAddress, selectAllAccount, useAppSelector } from '@mezon/store';
import { MezonIcon, MzIcons16 } from '@mezon/ui';
import { formatBalanceToString, generateE2eId } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import type { Transaction } from 'mmn-client-js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonCopy } from '../../../components';
import { CURRENCY, TRANSACTION_DETAIL } from '../constants/constants';

const ICON_CLASS = new Map<unknown, string>([
	[MzIcons16.mzUser, 'text-[#92B8FF]'],
	[MzIcons16.mzCoin, 'text-[var(--mz-icon)]'],
	[MzIcons16.mzHistory, 'text-[var(--mz-icon)]'],
	[MzIcons16.mzTransaction, 'text-[var(--mz-icon)]'],
	[MzIcons16.mzEdit, 'text-[var(--mz-icon)]']
]);

interface TransactionDetailProps {
	detailLedger: Transaction;
	formatDate: (dateString: string) => string;
	isLoading?: boolean;
}

const TransactionDetailSkeleton: React.FC = () => {
	const { t } = useTranslation('transactionHistory');
	const { FIELDS } = TRANSACTION_DETAIL;

	const detailFields = [
		{ id: 'transaction_id', label: t(FIELDS.TRANSACTION_ID), icon: MzIcons16.mzTransaction },
		{ id: 'sender', label: t(FIELDS.SENDER), icon: MzIcons16.mzUser },
		{ id: 'amount', label: t(FIELDS.AMOUNT), icon: MzIcons16.mzCoin },
		{ id: 'receiver', label: t(FIELDS.RECEIVER), icon: MzIcons16.mzUser },
		{ id: 'note', label: t(FIELDS.NOTE), icon: MzIcons16.mzEdit },
		{ id: 'created', label: t(FIELDS.CREATED), icon: MzIcons16.mzHistory }
	];

	return (
		<div className="p-4 bg-item-theme text-theme-primary ">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{detailFields.map(({ id, label, icon }) => (
					<div key={id} className="space-y-2">
						<div className="flex items-center gap-2">
							<MezonIcon icon={icon} className={ICON_CLASS.get(icon)} />
							<p className="text-xs font-medium uppercase tracking-wide">{label}</p>
							{id === 'transaction_id' && (
								<span>
									<ButtonCopy copyText="" className="p-1" duration={TRANSACTION_DETAIL.COPY_DURATION} disabled={true} />
								</span>
							)}
						</div>
						<div className="h-5 w-32 bg-item-theme rounded ml-5" />
					</div>
				))}
			</div>
		</div>
	);
};

const TransactionDetail: React.FC<TransactionDetailProps> = React.memo(({ detailLedger, formatDate, isLoading = false }) => {
	const { t } = useTranslation('transactionHistory');
	const { FIELDS, UNKNOWN_USER } = TRANSACTION_DETAIL;
	const currentUser = useAppSelector(selectAllAccount);
	const walletAddress = useAppSelector(selectAddress);

	const detailFields = useMemo(() => {
		if (!detailLedger) return [];
		const extraInfo = safeJSONParse(detailLedger.extra_info);
		const isCurrentUserSender =
			walletAddress && detailLedger.from_address ? walletAddress.toLowerCase() === detailLedger.from_address.toLowerCase() : false;
		const isCurrentUserReceiver =
			walletAddress && detailLedger.to_address
				? walletAddress.toLowerCase() === detailLedger.to_address.toLowerCase()
				: walletAddress && detailLedger.from_address
					? walletAddress.toLowerCase() !== detailLedger.from_address.toLowerCase()
					: false;

		const sender = extraInfo?.UserSenderUsername || (isCurrentUserSender ? currentUser?.user?.username : null);
		const receiver =
			extraInfo?.UserReceiverName || extraInfo?.UserReceiverUsername || (isCurrentUserReceiver ? currentUser?.user?.username : null);

		return [
			{ id: 'transaction_id', label: t(FIELDS.TRANSACTION_ID), value: detailLedger.hash, icon: MzIcons16.mzTransaction },
			{ id: 'sender', label: t(FIELDS.SENDER), value: sender || t(UNKNOWN_USER), icon: MzIcons16.mzUser },
			{
				id: 'amount',
				label: t(FIELDS.AMOUNT),
				value: `${formatBalanceToString(detailLedger.value)} ${t(CURRENCY.SYMBOL)}`,
				icon: MzIcons16.mzCoin
			},
			{ id: 'receiver', label: t(FIELDS.RECEIVER), value: receiver || t(UNKNOWN_USER), icon: MzIcons16.mzUser },
			{ id: 'note', label: t(FIELDS.NOTE), value: detailLedger.text_data || t(TRANSACTION_DETAIL.DEFAULT_NOTE), icon: MzIcons16.mzEdit },
			{
				id: 'created',
				label: t(FIELDS.CREATED),
				value: formatDate(new Date((detailLedger.transaction_timestamp ?? 0) * 1000).toISOString()),
				icon: MzIcons16.mzHistory
			}
		];
	}, [detailLedger, t, formatDate, FIELDS, UNKNOWN_USER, walletAddress, currentUser]);

	if (isLoading) {
		return <TransactionDetailSkeleton />;
	}

	if (!detailLedger) {
		return null;
	}

	return (
		<div className="p-4 bg-item-theme text-theme-primary">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{detailFields.map(({ id, label, value, icon }) => (
					<div key={id} className="space-y-2">
						<div className="flex items-center gap-2">
							<MezonIcon icon={icon} className={ICON_CLASS.get(icon)} />
							<p
								className="text-xs font-medium uppercase tracking-wide"
								data-e2e={generateE2eId('send_token.modal.transaction_history.item.detail.label')}
							>
								{label}
							</p>
							{id === 'transaction_id' && value && (
								<span onClick={(e) => e.stopPropagation()}>
									<ButtonCopy copyText={value} className="p-1" duration={TRANSACTION_DETAIL.COPY_DURATION} />
								</span>
							)}
						</div>
						<p
							className=" text-sm font-medium break-all pl-5"
							data-e2e={generateE2eId('send_token.modal.transaction_history.item.detail.value')}
						>
							{value}
						</p>
					</div>
				))}
			</div>
		</div>
	);
});

export default TransactionDetail;
