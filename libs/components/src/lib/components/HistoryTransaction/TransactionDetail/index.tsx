import { MezonIcon, MzIcons16 } from '@mezon/ui';
import { formatNumber } from '@mezon/utils';
import React from 'react';
import { ButtonCopy } from '../../../components';
import { CURRENCY, TRANSACTION_DETAIL } from '../constans/constans';

const ICON_CLASS = new Map<unknown, string>([
	[MzIcons16.mzUser, 'text-[#92B8FF]'],
	[MzIcons16.mzCoin, 'text-[var(--mz-icon)]'],
	[MzIcons16.mzHistory, 'text-[var(--mz-icon)]'],
	[MzIcons16.mzTransaction, 'text-[var(--mz-icon)]'],
	[MzIcons16.mzEdit, 'text-[var(--mz-icon)]']
]);

interface TransactionDetailProps {
	detailLedger: any;
	formatDate: (dateString: string) => string;
	isLoading?: boolean;
}

const TransactionDetailSkeleton: React.FC = () => {
	const { FIELDS } = TRANSACTION_DETAIL;

	const detailFields = [
		{ label: FIELDS.TRANSACTION_ID, icon: MzIcons16.mzTransaction },
		{ label: FIELDS.SENDER, icon: MzIcons16.mzUser },
		{ label: FIELDS.AMOUNT, icon: MzIcons16.mzCoin },
		{ label: FIELDS.RECEIVER, icon: MzIcons16.mzUser },
		{ label: FIELDS.NOTE, icon: MzIcons16.mzEdit },
		{ label: FIELDS.CREATED, icon: MzIcons16.mzHistory }
	];

	return (
		<div className="p-4 bg-item-theme text-theme-primary ">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{detailFields.map(({ label, icon }) => (
					<div key={label} className="space-y-2">
						<div className="flex items-center gap-2">
							<MezonIcon icon={icon} className={ICON_CLASS.get(icon)} />
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

	const { FIELDS } = TRANSACTION_DETAIL;

	const detailFields = [
		{ label: FIELDS.TRANSACTION_ID, value: detailLedger.trans_id, icon: MzIcons16.mzTransaction },
		{ label: FIELDS.SENDER, value: detailLedger.sender_username, icon: MzIcons16.mzUser },
		{
			label: FIELDS.AMOUNT,
			value: `${formatNumber(detailLedger.amount, CURRENCY.CODE)} ${CURRENCY.SYMBOL}`,
			icon: MzIcons16.mzCoin
		},
		{ label: FIELDS.RECEIVER, value: detailLedger.receiver_username, icon: MzIcons16.mzUser },
		{ label: FIELDS.NOTE, value: detailLedger.metadata || TRANSACTION_DETAIL.DEFAULT_NOTE, icon: MzIcons16.mzEdit },
		{ label: FIELDS.CREATED, value: formatDate(detailLedger.create_time ?? ''), icon: MzIcons16.mzHistory }
	];

	return (
		<div className="p-4 bg-item-theme text-theme-primary">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{detailFields.map(({ label, value, icon }) => (
					<div key={value} className="space-y-2">
						<div className="flex items-center gap-2">
							<MezonIcon icon={icon} className={ICON_CLASS.get(icon)} />
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
