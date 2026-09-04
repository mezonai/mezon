import { useTranslation } from 'react-i18next';
import { SortableHeader } from './SortableHeader';

const TableMemberHeader = () => {
	const { t } = useTranslation('memberTable');

	return (
		<div className="flex flex-row justify-between items-center px-4 h-12 shadow border-b-theme-primary">
			<SortableHeader field="name" label={t('headers.name')} className="flex-3" />
			<SortableHeader field="memberSince" label={t('headers.memberSince')} className="flex-1 justify-center" />
			<SortableHeader field="joinedMezon" label={t('headers.joinedMezon')} className="flex-1 justify-center" />
			<SortableHeader field="roles" label={t('headers.roles')} className="flex-2 justify-center" />
		</div>
	);
};

export default TableMemberHeader;
