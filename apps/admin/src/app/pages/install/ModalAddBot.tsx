import { addBotChat, getApplicationDetail, selectAllAccount, selectAllClans, selectAppDetail, useAppDispatch } from '@mezon/store';
import { memo, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import FooterModal from './components/FooterModal';
import HeaderModal from './components/HeaderModal';
import ModalAsk from './components/ModalAsk';
import ModalSuccess from './components/ModalSuccess';
import type { SelectFieldConfig } from './components/SelectField';
import SelectField from './components/SelectField';

enum RequestStatusSuccess {
	Fulfill = 'fulfilled'
}

type ModalAddBotProps = {
	applicationId: string;
	handleOpenModal: () => void;
};

const ModalAddBot = memo(({ applicationId, handleOpenModal }: ModalAddBotProps) => {
	const clans = useSelector(selectAllClans);
	const dispatch = useAppDispatch();
	const account = useSelector(selectAllAccount);
	const appDetail = useSelector(selectAppDetail);

	const [openSuccess, setOpenSuccess] = useState(false);
	const toggleSuccess = () => setOpenSuccess((s) => !s);

	const [clanValue, setClanValue] = useState('');
	const [clanError, setClanError] = useState<string>();

	useEffect(() => {
		if (applicationId) {
			dispatch(getApplicationDetail({ appId: applicationId }));
		}
	}, [applicationId, dispatch]);

	const clanConfig: SelectFieldConfig<any> = {
		label: 'Add to clan',
		value: clanValue,
		onChange: (v) => {
			setClanError(undefined);
			setClanValue(v);
		},
		errorMessage: clanError,
		options: clans.map((clan) => ({
			label: clan.clan_name,
			value: clan.id
		}))
	};

	const handleAdd = useCallback(async () => {
		let hasError = false;
		if (!clanValue) {
			setClanError('Please select a clan.');
			hasError = true;
		}
		if (hasError) return;

		const cleanAppId = applicationId.replace(/\s+/g, ' ').trim();
		const cleanClanId = clanValue.replace(/\s+/g, ' ').trim();

		try {
			const resp = await dispatch(
				addBotChat({
					appId: cleanAppId,
					clanId: cleanClanId
				})
			);

			if (resp.meta.requestStatus === RequestStatusSuccess.Fulfill) {
				toggleSuccess();
			} else {
				toast.error('You are not the owner of this clan. Please choose your own clan.');
			}
		} catch (error: any) {
			console.error('Add bot failed:', error);
			toast.error('Add bot failed. Refresh the page and try again.');
		}
	}, [applicationId, clanValue, dispatch]);

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
			<FooterModal name={appDetail?.appname || ''} />
			<ModalAsk handelBack={handleOpenModal} handleAddBotOrApp={handleAdd} />
		</div>
	);
});

export default ModalAddBot;
