import { useTranslation } from 'react-i18next';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

const ErrorRoutes = () => {
	const { t } = useTranslation(['adminApplication', 'common']);
	const error = useRouteError();
	const isNotFound = isRouteErrorResponse(error) && error.status === 404;

	if (!isNotFound) {
		console.error(error);
	}

	return (
		<div className="flex flex-col items-center justify-center gap-4 h-full min-h-[60vh] p-6 text-center dark:text-textDarkTheme text-textLightTheme">
			<h2 className="text-2xl font-semibold">{isNotFound ? t('appNotFound.title') : t('common:errorBoundary.title')}</h2>
			<p className="max-w-md dark:text-textSecondary">{isNotFound ? t('appNotFound.description') : t('common:errorBoundary.crashMessage')}</p>
			{isNotFound ? (
				<Link
					to="/developers/applications"
					replace
					className="text-[15px] py-[10px] px-[16px] text-white bg-[#5865F2] hover:bg-[#4752c4] rounded-md"
				>
					{t('backToApps')}
				</Link>
			) : (
				<button
					onClick={() => window.location.reload()}
					className="text-[15px] py-[10px] px-[16px] text-white bg-[#5865F2] hover:bg-[#4752c4] rounded-md"
				>
					{t('common:errorBoundary.reload')}
				</button>
			)}
		</div>
	);
};

export default ErrorRoutes;
