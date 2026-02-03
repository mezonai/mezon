import { Icons } from '@mezon/ui';
import { useTranslation } from 'react-i18next';

type EmptyNotification = {
	isEmptyForYou?: boolean;
	isEmptyMessages?: boolean;
	isEmptyMentions?: boolean;
};

const EmptyNotification = ({ isEmptyForYou, isEmptyMessages, isEmptyMentions }: EmptyNotification) => {
	const { t } = useTranslation('notifications');

	return (
		<div className="m-4 flex flex-col justify-center h-[400px] py-[80px] select-none">
			{isEmptyForYou && <EmptyForYou t={t} />}
			{isEmptyMessages && <EmptyMessages t={t} />}
			{isEmptyMentions && <EmptyMentions t={t} />}
		</div>
	);
};

export default EmptyNotification;

const EmptyForYou = ({ t }: { t: any }) => {
	return (
		<>
			<img className="mx-auto mb-4" src="/assets/images/empty-for-you.svg" alt="empty-for-you" />
			<h1 className="text-center  text-lg font-bold mb-2">{t('empty.forYou.title')}</h1>
			<div className="text-center text-base font-medium ">{t('empty.forYou.description')}</div>
		</>
	);
};

const EmptyMessages = ({ t }: { t: any }) => {
	return (
		<>
			<button className="relative mx-auto mb-4 p-[22px] rounded-full cursor-default">
				<Icons.EmptyUnread className="w-9 h-9 " />
				<Icons.EmptyUnreadStyle className="w-[104px] h-[80px] absolute top-0 left-[-10px]" />
			</button>
			<h1 className="text-center  text-2xl font-semibold mb-2">{t('empty.messages.title')}</h1>
			<div className="text-center text-xs font-normal ">
				<span className="uppercase text-xs text-textPro font-semibold">{t('empty.messages.protip')} </span>
				{t('empty.messages.description')}
			</div>
		</>
	);
};

const EmptyMentions = ({ t }: { t: any }) => {
	return (
		<>
			<button className="relative mx-auto mb-4 p-[22px] rounded-full cursor-default">
				<Icons.EmptyMention className="w-9 h-9 " />
				<Icons.EmptyUnreadStyle className="w-[104px] h-[80px] absolute top-0 left-[-10px]" />
			</button>
			<h1 className="text-center  text-2xl font-semibold mb-2">{t('empty.mentions.title')}</h1>
			<div className="text-center text-xs font-normal ">
				<span className="uppercase text-xs text-textPro font-semibold">{t('empty.mentions.protip')} </span>
				{t('empty.mentions.description')}
			</div>
		</>
	);
};
