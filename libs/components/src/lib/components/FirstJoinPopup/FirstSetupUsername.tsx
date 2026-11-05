import { accountActions, useAppDispatch } from '@mezon/store';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

const FirstSetupUsername = () => {
	const { t } = useTranslation('common');
	const [inputValue, setInputValue] = useState('');
	const dispatch = useAppDispatch();
	const handleSetInputValue = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	}, []);

	const handleUpdateUsername = useCallback(() => {
		try {
			dispatch(
				accountActions.updateAccountUsername({
					username: inputValue
				})
			);
		} catch (error) {
			console.error(error);
		}
	}, [inputValue, dispatch]);
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
			<div className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl overflow-hidden">
				<div className="px-7 pt-8 pb-7 flex flex-col gap-6">
					{/* Header */}
					<div className="text-center flex flex-col gap-2">
						<h2 className="text-2xl font-bold text-gray-900">Set up your username</h2>
						<p className="text-sm text-gray-500 leading-relaxed">
							Choose a username so others can easily recognize and connect with you.
						</p>
					</div>

					{/* Input */}
					<div className="flex flex-col gap-2">
						<div className="flex justify-between items-center">
							<label className="text-sm font-semibold text-gray-700">Username</label>
							<span className="text-xs font-medium text-red-500">Required</span>
						</div>

						<div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 px-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
							<span className="text-gray-400 text-lg">@</span>
							<input
								type="text"
								value={inputValue}
								onChange={handleSetInputValue}
								placeholder="Enter your username"
								className="w-full bg-transparent outline-none px-2 py-3 text-sm text-gray-900"
							/>
						</div>

						<p className="text-xs text-gray-400">Your username must be unique and cannot be empty.</p>
					</div>

					{/* Submit */}
					<button
						onClick={handleUpdateUsername}
						disabled={!inputValue.trim()}
						className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
					>
						Save username
					</button>

					<p className="text-xs text-center text-gray-400">You need to set a username before continuing.</p>
				</div>
			</div>
		</div>
	);
};

export default FirstSetupUsername;
