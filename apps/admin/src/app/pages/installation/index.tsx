import { getApplicationDetail, selectAppDetail, useAppDispatch } from '@mezon/store';
import copy from 'copy-to-clipboard';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

const Installation = () => {
	const dispatch = useAppDispatch();
	const { applicationId } = useParams();
	const application = useSelector(selectAppDetail);
	const [isLoading, setIsLoading] = useState(true);
	const [idCopied, setIdCopied] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			if (applicationId) {
				setIsLoading(true);
				try {
					await dispatch(getApplicationDetail({ appId: applicationId })).unwrap();
				} catch (error) {
					console.error('Failed to fetch application details:', error);
				} finally {
					setIsLoading(false);
				}
			}
		};

		fetchData();
	}, [applicationId, dispatch]);

	if (isLoading) {
		return <div className="text-red-500">Loading application data...</div>;
	}

	if (!application || !applicationId) {
		return <div className="text-red-500">Application data not found</div>;
	}

	const linkInstall = window.location.origin + (application.app_url ? '/developers/app/install/' : '/developers/bot/install/') + applicationId;

	const handleCopyToClipboard = () => {
		copy(linkInstall);
		setIdCopied(true);
		setTimeout(() => {
			setIdCopied(false);
		}, 2000);
	};

	return (
		<div className="text-xl">
			<h3 className="text-2xl font-semibold mb-4">Installation</h3>
			<p className="dark:text-contentTertiary text-colorTextLightMode mb-8">
				Choose how users will install your app. Create an installation link, choose which installation context to support, and define the
				scopes and permissions you want to request.
			</p>
			<div className="rounded dark:bg-bgSecondary bg-bgLightSecondary p-5 dark:text-textPrimary text-colorTextLightMode space-y-5">
				<div>
					<h4 className="font-medium mb-1">Install Link</h4>
					<p className="text-base">
						Use our provided install link or register a custom one. If you choose a custom link, users who add your app will be redirected
						to your URL instead of the Add App flow in Mezon.
					</p>
				</div>
				<select
					name="link"
					className="block w-full mt-1 dark:bg-black bg-bgLightTertiary rounded p-2 font-normal text-base tracking-wide outline-none"
				>
					<option>Mezon Provided Link</option>
				</select>
				<div className="relative">
					<input
						type="text"
						className="w-full p-2 dark:bg-black bg-bgLightTertiary rounded text-base cursor-not-allowed"
						readOnly
						value={linkInstall}
					/>
					<button
						onClick={handleCopyToClipboard}
						className={`absolute right-0 bottom-0 ${idCopied ? 'bg-gray-500' : 'bg-indigo-600  hover:bg-indigo-700'
							} text-white text-sm font-light px-3 py-1.5   rounded-lg mr-1 mb-1`}
					>
						{idCopied ? 'Copied!' : 'Copy'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default Installation;
