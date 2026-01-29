import { useTranslation } from 'react-i18next';

interface LoadingStateProps {
	message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
	const { t } = useTranslation('dashboard');

	return (
		<div className="bg-white dark:bg-[#2b2d31] p-12 rounded-lg border dark:border-[#4d4f52] text-center">
			<div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#5865F2] border-r-transparent"></div>
			<div className="mt-4 text-sm dark:text-textSecondary">{message || t('state.loadingData')}</div>
		</div>
	);
}

interface NoDataStateProps {
	message?: string;
	description?: string;
}

export function NoDataState({ message, description }: NoDataStateProps) {
	const { t } = useTranslation('dashboard');

	return (
		<div className="bg-white dark:bg-[#2b2d31] p-12 rounded-lg border dark:border-[#4d4f52] text-center">
			<svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<h3 className="mt-4 text-lg font-medium dark:text-textPrimary">{message || t('state.noDataFound')}</h3>
			<p className="mt-2 text-sm dark:text-textSecondary">{description || t('state.noDataDescription')}</p>
		</div>
	);
}
