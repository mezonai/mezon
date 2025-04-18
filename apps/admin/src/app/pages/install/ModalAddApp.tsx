import {
	categoriesActions,
	createNewChannel,
	selectAllAccount,
	selectAllCategories,
	selectAllClans,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { memo, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { ChannelType } from 'mezon-js';
import { ApiCreateChannelDescRequest } from 'mezon-js/api.gen';
import FooterModal from './components/FooterModal';
import HeaderModal from './components/HeaderModal';
import ModalAsk from './components/ModalAsk';
import ModalSuccess from './components/ModalSuccess';
import SelectField, { SelectFieldConfig } from './components/SelectField';

enum RequestStatusSuccess {
	Fulfill = 'fulfilled'
}

type ModalAddAppProps = {
	nameApp?: string;
	applicationId: string;
	handleOpenModal: () => void;
};

const ModalAddApp = memo(({ nameApp = '', applicationId, handleOpenModal }: ModalAddAppProps) => {
	const dispatch = useAppDispatch();
	const account = useSelector(selectAllAccount);

	const [openSuccess, setOpenSuccess] = useState(false);
	const toggleSuccess = () => setOpenSuccess((s) => !s);

	const [clanValue, setClanValue] = useState('');
	const [clanError, setClanError] = useState<string>();
	const [categoryValue, setCategoryValue] = useState('');
	const [categoryError, setCategoryError] = useState<string>();

	useEffect(() => {
		if (clanValue) {
			dispatch(categoriesActions.fetchCategories({ clanId: clanValue }));
		}
	}, [clanValue, dispatch]);

	const clans = useSelector(selectAllClans);

	const categories = useAppSelector((state) => selectAllCategories(state, clanValue));
	const clanConfig: SelectFieldConfig<any> = {
		label: 'Add to clan',
		value: clanValue,
		onChange: (v) => {
			setClanError(undefined);
			setClanValue(v);
			setCategoryValue('');
		},
		errorMessage: clanError,
		options: clans.map((clan) => ({
			label: clan.clan_name,
			value: clan.id
		}))
	};

	const categoryConfig: SelectFieldConfig<any> = {
		label: 'Add to category',
		value: categoryValue,
		onChange: (v) => {
			setCategoryError(undefined);
			setCategoryValue(v);
		},
		errorMessage: categoryError,
		options: categories.map((mapCategoryToOption) => ({
			label: mapCategoryToOption.category_name,
			value: mapCategoryToOption.id
		}))
	};
	const handleAdd = useCallback(async () => {
		let hasError = false;
		if (!clanValue) {
			setClanError('Please select a clan.');
			hasError = true;
		}
		if (!categoryValue) {
			setCategoryError('Please select a category.');
			hasError = true;
		}
		if (hasError) return;
		const sanitizeLabel = (label: string) => label.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 32);
		const data: ApiCreateChannelDescRequest = {
			channel_label: sanitizeLabel(nameApp),
			app_id: applicationId,
			clan_id: clanValue,
			category_id: categoryValue,
			type: ChannelType.CHANNEL_TYPE_APP,
			channel_private: 0,
			parent_id: '0'
		};
		try {
			const resp = await dispatch(createNewChannel(data)).unwrap();
			toggleSuccess();
		} catch (error) {
			console.error('Create channel failed:', error);
		}
	}, [applicationId, clanValue, categoryValue, dispatch]);

	if (openSuccess) {
		return <ModalSuccess name={nameApp} clan={{ clanId: clanValue, clanName: '', isEmpty: false }} />;
	}

	return (
		<div className="rounded overflow-hidden dark:bg-bgProfileBody bg-bgLightMode max-w-[440px] w-full flex flex-col text-center">
			<HeaderModal name={nameApp} username={account?.user?.username} />
			<SelectField {...clanConfig} />
			{clanValue && <SelectField {...categoryConfig} />}
			<FooterModal name={nameApp} />
			<ModalAsk handelBack={handleOpenModal} handleAddBotOrApp={handleAdd} />
		</div>
	);
});

export default ModalAddApp;
