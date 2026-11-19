import { accountActions, selectAllAccount, useAppDispatch } from '@mezon/store';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const FirstSetupUsername = () => {
	const { t } = useTranslation('common');
	const [inputValue, setInputValue] = useState('');
	const dispatch = useAppDispatch();
	const userProfile = useSelector(selectAllAccount);
	const handleSetInputValue = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	}, []);

	const handleUpdateUsername = useCallback(async () => {
		try {
			await dispatch(
				accountActions.updateAccountUsername({
					username: inputValue
				})
			).unwrap();
		} catch {
			toast.error(t('updateUsername.errorDuplicate'));
		}
	}, [inputValue, dispatch, userProfile?.user?.display_name, t]);
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
								placeholder={t('updateUsername.enterUsername')}
								className="w-full bg-transparent outline-none px-2 py-3 text-sm text-gray-900"
							/>
						</div>
					</div>

					{/* Submit */}
					<button
						onClick={handleUpdateUsername}
						disabled={!inputValue.trim()}
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
