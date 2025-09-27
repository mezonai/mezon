import { selectAllUsersByUser } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { formatBalanceToString } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { Transaction } from 'mmn-client-js';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ButtonCopy } from '../../../components';
import { CURRENCY, TRANSACTION_DETAIL } from '../constants/constants';

interface TransactionDetailProps {
	detailLedger: Transaction;
	formatDate: (dateString: string) => string;
	isLoading?: boolean;
}

const TransactionDetailSkeleton: React.FC = () => {
	const { FIELDS } = TRANSACTION_DETAIL;

	const detailFields = [
		{ label: FIELDS.TRANSACTION_ID, icon: Icons.Transaction },
		{ label: FIELDS.SENDER, icon: Icons.UserIcon },
		{ label: FIELDS.AMOUNT, icon: () => <Icons.DollarIcon defaultSize="w-3 h-3" isWhite /> },
		{ label: FIELDS.RECEIVER, icon: Icons.UserIcon },
		{ label: FIELDS.NOTE, icon: Icons.PenEdit },
		{ label: FIELDS.CREATED, icon: () => <Icons.ClockHistory defaultSize="w-3 h-3" /> }
	];

	return (
		<div className="p-4 bg-item-theme text-theme-primary ">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{detailFields.map(({ label, icon: Icon }) => (
					<div key={label} className="space-y-2">
						<div className="flex items-center gap-2">
							<Icon className="w-3 h-3 " />
							<p className="text-xs font-medium uppercase tracking-wide">{label}</p>
							{label === FIELDS.TRANSACTION_ID && (
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
	if (isLoading) {
		return <TransactionDetailSkeleton />;
	}

	if (!detailLedger) {
		return null;
	}

	const usersClan = useSelector(selectAllUsersByUser);
	const { FIELDS, UNKNOWN_USER } = TRANSACTION_DETAIL;

	const detailFields = useMemo(() => {
		const extraInfo = safeJSONParse(detailLedger.extra_info);
		const sender = extraInfo?.UserSenderId ? usersClan.find((user) => user.id === extraInfo?.UserSenderId) : null;
		const receiver = extraInfo?.UserReceiverId ? usersClan.find((user) => user.id === extraInfo?.UserReceiverId) : null;
		return [
			{ label: FIELDS.TRANSACTION_ID, value: detailLedger.hash, icon: Icons.Transaction },
			{ label: FIELDS.SENDER, value: sender?.username || UNKNOWN_USER, icon: Icons.UserIcon },
			{
				label: FIELDS.AMOUNT,
				value: `${formatBalanceToString(detailLedger.value)} ${CURRENCY.SYMBOL}`,
				icon: () => <Icons.DollarIcon defaultSize="w-3 h-3" isWhite />
			},
			{ label: FIELDS.RECEIVER, value: receiver?.username || UNKNOWN_USER, icon: Icons.UserIcon },
			{ label: FIELDS.NOTE, value: detailLedger.text_data || TRANSACTION_DETAIL.DEFAULT_NOTE, icon: Icons.PenEdit },
			{
				label: FIELDS.CREATED,
				value: formatDate(new Date((detailLedger.transaction_timestamp ?? 0) * 1000).toISOString()),
				icon: () => <Icons.ClockHistory defaultSize="w-3 h-3" />
			}
		];
	}, [usersClan, detailLedger]);

	return (
		<div className="p-4 bg-item-theme text-theme-primary">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{detailFields.map(({ label, value, icon: Icon }) => (
					<div key={value} className="space-y-2">
						<div className="flex items-center gap-2">
							<Icon className="w-3 h-3 " />
							<p className="text-xs font-medium uppercase tracking-wide">{label}</p>
							{label === FIELDS.TRANSACTION_ID && value && (
								<span onClick={(e) => e.stopPropagation()}>
									<ButtonCopy copyText={value} className="p-1" duration={TRANSACTION_DETAIL.COPY_DURATION} />
								</span>
							)}
						</div>
						<p className=" text-sm font-medium break-all pl-5">{value}</p>
					</div>
				))}
			</div>
		</div>
	);
});

export default TransactionDetail;
