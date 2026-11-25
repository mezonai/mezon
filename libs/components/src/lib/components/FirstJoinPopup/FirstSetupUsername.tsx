import { accountActions, useAppDispatch } from '@mezon/store';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

export const toMezonUsername = (name: string): string =>
	name
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'D')
		.toLowerCase()
		.replace(/[^a-z0-9._\-+]/g, '')
		.slice(0, 32);

const FirstSetupUsername = () => {
	const { t } = useTranslation('common');
	const [inputValue, setInputValue] = useState('');
	const dispatch = useAppDispatch();
	const username = useMemo(() => toMezonUsername(inputValue), [inputValue]);
	const handleSetInputValue = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	}, []);

	const handleUpdateUsername = useCallback(async () => {
		if (!username) return;
		try {
			await dispatch(
				accountActions.updateAccountUsername({
					username
				})
			).unwrap();
		} catch {
			toast.error(t('updateUsername.errorDuplicate'));
		}
	}, [username, dispatch, t]);
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
			<div className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl overflow-hidden">
				<div className="px-7 pt-8 pb-7 flex flex-col gap-6">
					{/* Header */}
					<div className="text-center flex flex-col gap-2">
						<h2 className="text-2xl font-bold text-gray-900">{t('updateUsername.enterUsername')}</h2>
						<p className="text-sm text-gray-500 leading-relaxed">{t('updateUsername.usernamePlaceholder')}</p>
					</div>

					{/* Input */}
					<div className="flex flex-col gap-2">
						<div className="flex justify-between items-center">
							<label className="text-sm font-semibold text-gray-700">{t('updateUsername.enterUsername')}</label>
						</div>

						<div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 px-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
							<span className="text-gray-400 text-lg">@</span>
							<input
								type="text"
								value={inputValue}
								onChange={handleSetInputValue}
								placeholder={t('updateUsername.yourName')}
								className="w-full bg-transparent outline-none px-2 py-3 text-sm text-gray-900"
							/>
						</div>
						{username && <p className="text-xs text-gray-500">{t('updateUsername.usernamePreview', { username })}</p>}
					</div>

					{/* Submit */}
					<button
						onClick={handleUpdateUsername}
						disabled={!username}
						className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
					>
						{t('updateUsername.update')}
					</button>
				</div>
			</div>
		</div>
	);
};

export default FirstSetupUsername;
