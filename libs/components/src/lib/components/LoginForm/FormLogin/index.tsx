import { yupResolver } from '@hookform/resolvers/yup';
import { RootState, authActions, selectTheme, useAppDispatch } from '@mezon/store';
import { Icons, Loading } from '@mezon/ui';
import { BaseSyntheticEvent, useCallback, useState } from 'react';
import { Resolver, useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import * as Yup from 'yup';

export type LoginFormPayload = {
	userEmail: string;
	password: string;
	remember: boolean;
};

type LoginFormProps = {
	onSubmit: (data: LoginFormPayload) => void;
};

export const validationSchema = Yup.object().shape({
	userEmail: Yup.string().email('Invalid email address').required('Email is required'),
	password: Yup.string()
		.required('Password is required')
		.matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, 'Must Contain 8 Characters, One Uppercase, One Lowercase, One Number')
});

function LoginForm(props: LoginFormProps) {
	const isLoading = useSelector((state: RootState) => state.auth.loadingStatus);
	const dispatch = useAppDispatch();

	const { onSubmit } = props;
	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm<LoginFormPayload>({
		resolver: yupResolver(validationSchema) as unknown as Resolver<LoginFormPayload>,

		defaultValues: {
			password: '',
			remember: false,
			userEmail: ''
		}
	});

	const submitForm = useCallback(
		(data: LoginFormPayload) => {
			if (typeof onSubmit === 'function') {
				onSubmit(data);
			}
			return false;
		},
		[onSubmit]
	);

	const handleFormSubmit = useCallback(
		(e: BaseSyntheticEvent) => {
			e.preventDefault();
			handleSubmit(submitForm)(e);
		},
		[handleSubmit, submitForm]
	);

	const [showPassword, setShowPassword] = useState(false);

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	const handleRefreshStatusLogin = () => {
		dispatch(authActions.refreshStatus());
	};

	const appearanceTheme = useSelector(selectTheme);

	return (
		<div className="flex-col justify-start items-center flex lg:w-[496px] h-fit lg:px-0 w-450 max-w-full">
			<div className=" flex-row justify-start items-center flex w-full h-fit gap-x-4 pb-6">
				<hr className="h-[0.08px] w-[272px] border-[#1E1E1E]" />
				<p className="w-fit h-fit text-sm dark:text-[#aeaeae] text-black leading-[130%]">or</p>
				<hr className="h-[0.08px] w-[272px]  border-[#1E1E1E]" />
			</div>
			<div className="flex-col justify-start items-start flex w-full h-fit gap-y-5">
				<div className="flex-col justify-start items-start flex w-full h-fit gap-y-5 ">
					<div className="flex-col justify-start items-start flex w-full h-fit gap-y-3 relative">
						<div className="flex-row justify-start items-center flex w-full h-fit gap-x-1">
							<p
								className={`w-fit h-fit text-left text-sm font-medium leading-[150%] ${errors.userEmail ? 'dark:text-colorTextError text-[#dc2626]' : 'dark:text-[#cccccc] text-black'}`}
							>
								Email or Phone number
							</p>
							<p
								className={`w-fit h-fit text-left text-xs font-medium leading-[150%] ${errors.userEmail ? 'dark:text-colorTextError text-[#dc2626]' : 'text-[#dc2626]'}`}
							>
								{errors.userEmail ? '-' : '✱'}
							</p>
							<span className="dark:text-colorTextError text-[#dc2626] italic text-xs">
								{errors.userEmail && toast.error(errors.userEmail.message, { toastId: 'Email or Phone number invalid' })}
							</span>
						</div>
						<div
							className={`flex-row justify-start items-center flex w-full h-fit pt-3 pr-4 pb-3 pl-4 gap-x-2 rounded-[4px] dark:bg-[#000000] bg-white relative dark:border-[1px] dark:border-[#1e1e1e] ${
								errors.userEmail ? 'border-red-500' : 'border-[#1e1e1e]'
							}`}
						>
							<input
								className={`w-full h-6  dark:bg-transparent bg-white outline-none relative dark:text-white text-colorTextLightMode ${appearanceTheme === 'light' ? 'lightInputAutoFill' : 'darkInputAutoFill'}`}
								{...register('userEmail')}
								name="userEmail"
								id="userEmail"
								placeholder="Enter your email"
								autoComplete="userEmail"
							/>
						</div>
					</div>

					<div className="flex-col justify-start items-start flex w-full h-fit gap-y-3">
						<div className="flex-row justify-start items-center flex w-full h-fit gap-x-1 ">
							<p
								className={`w-fit h-fit text-left text-sm font-medium leading-[150%] ${errors.userEmail ? 'dark:text-colorTextError text-[#dc2626]' : 'dark:text-[#cccccc] text-black'}`}
							>
								Password
							</p>
							<p
								className={`w-fit h-fit text-left text-xs font-medium leading-[150%] ${errors.userEmail ? 'dark:text-colorTextError text-[#dc2626]' : 'text-[#dc2626]'}`}
							>
								{errors.password ? '-' : '✱'}
							</p>
							<span className="dark:text-colorTextError text-[#dc2626] italic text-xs">
								{errors.password && toast.error(errors.password.message, { toastId: 'login or password is invalid.' })}
							</span>
						</div>

						<div className="flex-col justify-start items-start flex w-full h-fit ">
							<div
								className={`flex-row justify-start items-center flex w-full h-fit pt-3 pr-4 pb-3 pl-4 gap-x-2 rounded-[4px] dark:bg-[#000000] bg-white dark:border-[1px] ${
									errors.password ? 'border-red-500' : 'border-[#1e1e1e]'
								} `}
							>
								<input
									type={showPassword ? 'text' : 'password'}
									className={`w-full h-6 dark:bg-transparent bg-white outline-none dark:text-white text-colorTextLightMode pl-0 border-none placeholder ${appearanceTheme === 'light' ? 'lightInputAutoFill' : 'darkInputAutoFill'}`}
									{...register('password')}
									name="password"
									id="password"
									placeholder="Enter your password"
									autoComplete="password"
								/>
								<button onClick={togglePasswordVisibility} className="outline-none z-50 fill-current left-0">
									{showPassword ? (
										<Icons.EyeOpen className="w-5 h-5 text-borderFocus" />
									) : (
										<Icons.EyeClose className="w-5 h-5 text-borderFocus" />
									)}
								</button>
							</div>

							<p className="w-full h-fit text-left text-sm font-medium pt-1 text-[#528bff] leading-[150%]">
								<span>
									<a className="hover:underline cursor-pointer">Forgot your password?</a>
								</span>
							</p>
						</div>
					</div>
				</div>

				<div className="flex-col justify-start items-start flex w-full h-fit">
					<button
						onClick={handleFormSubmit}
						className="flex-col justify-start items-center flex w-full h-[48px] pt-3 pr-4 pb-3 pl-4 rounded-[4px] bg-[#155eef] "
					>
						<div className="w-fit h-fit text-left text-base font-medium text-[#ffffff] leading-[150%] flex justify-center">
							{isLoading === 'loading' ? <Loading /> : isLoading === 'loaded' ? 'Login successful' : 'Sign in'}
						</div>
					</button>

					<div className="flex-row justify-start items-center flex w-full h-fit gap-y-2 ">
						<p className="w-fit h-fit text-left text-sm font-normal dark:text-[#cccccc] text-black leading-[130%]">Need an account?</p>
						<div className="flex-col justify-start items-center flex w-fit h-fit pt-2 pr-4 pb-2 pl-4 rounded-[4px] ">
							<p className="w-fit h-fit text-left text-sm font-medium hover:underline text-[#528bff] leading-[130%]">
								<span>
									<a className="hover:underline cursor-pointer">Sign up</a>
								</span>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default LoginForm;
