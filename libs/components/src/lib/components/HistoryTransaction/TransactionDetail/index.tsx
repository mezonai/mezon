import { Icons } from '@mezon/ui';
import { formatNumber } from '@mezon/utils';
import React from 'react';
import { ButtonCopy } from '../../../components';

interface TransactionDetailProps {
    detailLedger: any;
    formatDate: (dateString: string) => string;
}

const TransactionDetail: React.FC<TransactionDetailProps> = React.memo(({ detailLedger, formatDate }) => {
    if (!detailLedger) {
        return (
            <div className="border-t dark:border-gray-700 border-gray-200 p-4 dark:bg-gray-900/50 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                    {[...Array(6)].map((_, idx) => (
                        <div key={idx} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-gray-300 rounded-full" />
                                <div className="h-3 w-20 bg-gray-300 rounded" />
                            </div>
                            <div className="h-4 w-32 bg-gray-300 rounded pl-5" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const detailFields = [
        { label: 'Transaction ID', value: detailLedger.trans_id, icon: Icons.Transaction },
        { label: 'Sender ', value: detailLedger.sender_username, icon: Icons.UserIcon },
        { label: 'Amount', value: `${formatNumber(detailLedger.amount, 'vi-VN')} đ`, icon: () => <Icons.DollarIcon defaultSize="w-3 h-3" isWhite />, },
        { label: 'Receiver ', value: detailLedger.receiver_username, icon: Icons.UserIcon },
        { label: 'Note', value: detailLedger.metadata || 'No note', icon: Icons.PenEdit },
        { label: 'Created', value: formatDate(detailLedger.create_time ?? ''), icon: () => <Icons.ClockHistory defaultSize='w-3 h-3' /> },
    ];

    return (
        <div className="border-t dark:border-gray-700 border-gray-200 p-4 dark:bg-gray-900/50 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detailFields.map(({ label, value, icon: Icon }) => (
                    <div key={value} className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Icon className="w-3 h-3 dark:text-gray-400 text-gray-500" />
                            <p className="dark:text-gray-400 text-gray-600 text-xs font-medium uppercase tracking-wide">
                                {label}
                            </p>
                            {label === 'Transaction ID' && value && (
                                <span onClick={e => e.stopPropagation()}>
                                    <ButtonCopy
                                        copyText={value}
                                        className="p-1"
                                        duration={1500}
                                    />
                                </span>
                            )}
                        </div>
                        <p className="dark:text-white text-gray-900 text-sm font-medium break-all pl-5">{value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default TransactionDetail;
