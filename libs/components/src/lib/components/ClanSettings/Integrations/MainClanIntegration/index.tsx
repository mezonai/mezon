import { usePermissionChecker } from '@mezon/core';
import { Icons } from '@mezon/ui';
import { EPermission } from '@mezon/utils';
import type { ApiClanWebhook } from 'mezon-js/api.gen';
import { useTranslation } from 'react-i18next';

interface IClanIntegrationProps {
	setIsOpenClanWebhooks(): void;
	allClanWebhooks?: ApiClanWebhook[] | undefined;
}

const MainClanIntegrations = ({ setIsOpenClanWebhooks, allClanWebhooks }: IClanIntegrationProps) => {
	const { t } = useTranslation('integrations');
	const [isOwner, isMnClan, isAdmin] = usePermissionChecker([EPermission.clanOwner, EPermission.manageClan, EPermission.administrator]);

	return (
		<>
			{(isOwner || isMnClan || isAdmin) && (
				<div
					onClick={() => {
						if (allClanWebhooks && allClanWebhooks?.length !== 0) {
							setIsOpenClanWebhooks();
						}
					}}
					className={`mt-5 py-[20px] px-[16px] flex justify-between items-center border-theme-primary rounded-lg bg-item-theme ${allClanWebhooks?.length !== 0 ? 'cursor-pointer' : ''}`}
				>
					<div className="flex gap-4 max-sm:gap-0 max-sbm:w-[40%] items-center">
						<Icons.WebhooksIcon />
						<div>
							<div className="pb-[3px] font-semibold break-all text-theme-primary">{t('clanWebhooks')}</div>
							<div className="text-[12px] text-theme-primary">
								{allClanWebhooks?.length ? t('webhook_other', { count: allClanWebhooks?.length }) : t('webhookCount', { count: 0 })}
							</div>
						</div>
					</div>

					{allClanWebhooks && allClanWebhooks?.length === 0 ? (
						<div
							onClick={setIsOpenClanWebhooks}
							className="bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-md py-2 px-3 cursor-pointer font-semibold"
						>
							{t('createClanWebhook')}
						</div>
					) : (
						<div className="items-center cursor-pointer text-[14px] flex gap-[4px]">
							<div className="text-theme-primary">{t('viewClanWebhook')}</div>
							<Icons.ArrowDown defaultSize="h-[15px] w-[15px] -rotate-90" />
						</div>
					)}
				</div>
			)}
		</>
	);
};

export default MainClanIntegrations;
