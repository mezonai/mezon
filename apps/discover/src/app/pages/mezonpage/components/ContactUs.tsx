import { Button, Input, TextArea } from '@mezon/ui';
import { useEffect, useState } from 'react';

interface ContactUsProps {
	isOpen: boolean;
	onClose: () => void;
}

interface FormData {
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	otherContact1?: string;
	otherContact2?: string;
	reason: string;
	message: string;
}

export const ContactUs = ({ isOpen, onClose }: ContactUsProps) => {
	const [formData, setFormData] = useState<FormData>({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		otherContact1: '',
		otherContact2: '',
		reason: '',
		message: ''
	});

	const reasonOptions = ['Support', 'Partner', 'Sign up as Merchant'];

	const handleChange = (field: keyof FormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onClose();
	};

	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen, onClose]);

	useEffect(() => {
		if (!isOpen) return;
		const firstNameInput = document.getElementById('contact-first-name') as HTMLInputElement | null;
		firstNameInput?.focus();
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black bg-opacity-50 px-2 sm:px-4">
			<div className="relative w-full max-w-2xl mx-auto my-0 sm:my-6 max-h-[95vh] sm:max-h-none">
				<div className="relative flex flex-col w-full bg-white rounded-lg shadow-lg outline-none focus:outline-none max-h-[95vh] sm:max-h-none">
					<div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 rounded-t-lg flex-shrink-0">
						<h3 className="text-lg sm:text-2xl font-bold text-black">Contact Us</h3>
						<Button
							onClick={onClose}
							className="flex items-center justify-center w-8 h-8 text-black  transition-colors"
							aria-label="Close"
						>
							<span className="text-xl leading-none">×</span>
						</Button>
					</div>

					<form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-3 sm:space-y-6 overflow-y-auto flex-1">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
							<div>
								<label htmlFor="contact-first-name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
									First Name<span className="text-red-500">*</span>
								</label>
								<Input
									type="text"
									id="contact-first-name"
									required
									value={formData.firstName}
									onChange={(e) => handleChange('firstName', e.target.value)}
									className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label htmlFor="lastName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
									Last Name<span className="text-red-500">*</span>
								</label>
								<Input
									type="text"
									id="lastName"
									required
									value={formData.lastName}
									onChange={(e) => handleChange('lastName', e.target.value)}
									className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								/>
							</div>
						</div>

						<div>
							<label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
								Email Address<span className="text-red-500">*</span>
							</label>
							<Input
								type="email"
								id="email"
								required
								value={formData.email}
								onChange={(e) => handleChange('email', e.target.value)}
								className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Other contact method</label>
							<Input
								type="text"
								value={formData.otherContact1}
								onChange={(e) => handleChange('otherContact1', e.target.value)}
								className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label htmlFor="reason" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
								Reason of contact
							</label>
							<select
								id="reason"
								value={formData.reason}
								onChange={(e) => handleChange('reason', e.target.value)}
								className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
							>
								<option value="">Choose a reason</option>
								{reasonOptions.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
						</div>

						<div>
							<label htmlFor="message" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
								Message
							</label>
							<TextArea
								id="message"
								rows={3}
								value={formData.message}
								onChange={(e) => handleChange('message', e.target.value)}
								className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white text-gray-900"
							/>
						</div>

						<div className="pt-1 sm:pt-4 pb-2 sm:pb-0">
							<Button
								type="submit"
								className="w-full py-2 sm:py-3 text-xs sm:text-base text-white font-semibold rounded-lg bg-gradient-to-r from-[#8661df] to-[#7979ed] hover:bg-gradient-to-l transition-all duration-200 shadow-md hover:shadow-lg"
							>
								Submit
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};
