import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

export default function LoginDeeplinkPage() {
	const { t } = useTranslation('common');
	const { loginId } = useParams();

	const openApp = () => {
		if (!loginId) {
			return;
		}
		try {
			window.location.href = `mezon.ai://login/${loginId}`;
		} catch (e) {
			console.error('log  => login deeplink open app error', e);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-theme-primary">
			<div className="bg-theme-setting-primary border-theme-primary text-theme-primary rounded-md p-6 w-full max-w-[440px] flex flex-col items-center shadow-xl">
				<div className="flex items-center justify-center mb-4 w-12 h-12 rounded-md bg-gray-700">
					<img src="/assets/images/mezon-logo-white.svg" alt="Mezon" className="w-7 h-7" />
				</div>

				<p className="text-center text-base mb-5">{t('login.qr.openToConfirm')}</p>

				<button onClick={openApp} className="text-white w-full py-[10px] text-base font-medium rounded-md btn-primary btn-primary-hover">
					{t('login.qr.openApp')}
				</button>
			</div>
		</div>
	);
}
