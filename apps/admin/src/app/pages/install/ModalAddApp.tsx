import {
	categoriesActions,
	createNewChannel,
	getApplicationDetail,
	selectAllAccount,
	selectAllCategories,
	selectAllClans,
	selectAppDetail,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { ChannelType } from 'mezon-js';
import type { ApiCreateChannelDescRequest } from 'mezon-js/api.gen';
import { memo, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import FooterModal from './components/FooterModal';
import HeaderModal from './components/HeaderModal';
import ModalAsk from './components/ModalAsk';
import ModalSuccess from './components/ModalSuccess';
import type { SelectFieldConfig } from './components/SelectField';
import SelectField from './components/SelectField';
import TextField from './components/TextField';
enum RequestStatusSuccess {
	Fulfill = 'fulfilled'
}

type ModalAddAppProps = {
	applicationId: string;
	handleOpenModal: () => void;
};

const ModalAddApp = memo(({ applicationId, handleOpenModal }: ModalAddAppProps) => {
	const dispatch = useAppDispatch();
	const account = useSelector(selectAllAccount);
	const appDetail = useAppSelector(selectAppDetail);
	const [openSuccess, setOpenSuccess] = useState(false);
	const toggleSuccess = () => setOpenSuccess((s) => !s);
	const [clanValue, setClanValue] = useState('');
	const [labelValue, setLabelValue] = useState('');
	const [clanError, setClanError] = useState<string>();
	const [categoryValue, setCategoryValue] = useState('');
	const [categoryError, setCategoryError] = useState<string>();
	useEffect(() => {
		if (clanValue) {
			dispatch(categoriesActions.fetchCategories({ clanId: clanValue }));
		}
	}, [clanValue, dispatch]);

	useEffect(() => {
		if (applicationId) {
			dispatch(getApplicationDetail({ appId: applicationId }));
		}
	}, [applicationId, dispatch]);

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
		const sanitizeLabel = (label: string) =>
			label
				.replace(/[^\p{L}\p{M}\p{N} \-_]/gu, '')
				.normalize('NFC')
				.replace(/\s+/g, ' ')
				.trim()
				.slice(0, 32);

		const data: ApiCreateChannelDescRequest = {
			channel_label: sanitizeLabel(labelValue) || sanitizeLabel(appDetail?.appname || ''),
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
		} catch (error: any) {
			console.error('Failed to Add App:', error);

			if (error) {
				toast.error(`Failed to Add App: ${error.message || error}`);
			}
		}
	}, [applicationId, clanValue, categoryValue, labelValue, dispatch, appDetail]);

	if (openSuccess) {
		return <ModalSuccess name={appDetail?.appname || ''} clan={{ clanId: clanValue, clanName: '', isEmpty: false }} />;
	}

	return (
		<div className="rounded overflow-hidden dark:bg-bgProfileBody bg-bgLightMode max-w-[440px] w-full flex flex-col text-center">
			{appDetail && (
				<div className="flex flex-col items-center mt-4 mb-2">
					{appDetail.applogo ? (
						<img src={appDetail.applogo} alt={appDetail.appname} className="w-16 h-16 rounded-full object-cover mb-2" />
					) : (
						<span className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold mb-2">
							{appDetail.appname?.[0]}
						</span>
					)}
					<p className="text-xl font-semibold">{appDetail.appname}</p>
				</div>
			)}
			<HeaderModal name={appDetail?.appname || ''} username={account?.user?.username} />
			<SelectField uppercase={true} {...clanConfig} />
			{clanValue && <SelectField {...categoryConfig} />}
			<TextField label="Channel Name" value={labelValue} onChange={(v) => setLabelValue(v)} placeholder={appDetail?.appname || ''} />
			<FooterModal name={appDetail?.appname || ''} />
			<ModalAsk handelBack={handleOpenModal} handleAddBotOrApp={handleAdd} />
		</div>
	);
});

export default ModalAddApp;
