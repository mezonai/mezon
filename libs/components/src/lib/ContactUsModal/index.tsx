'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ContactUsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const ContactUsModal: React.FC<ContactUsModalProps> = ({ isOpen, onClose }) => {
	const modalRef = useRef<HTMLDivElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		otherContactMethod: '',
		reasonOfContact: '',
		message: ''
	});

	const styles = `
		@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
		@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
		@keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
		@keyframes slideDown { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(30px) scale(0.95); } }

		.modal-overlay { animation: fadeIn 0.3s ease-out; }
		.modal-overlay.closing { animation: fadeOut 0.3s ease-out forwards; }
		.modal-content { animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
		.modal-content.closing { animation: slideDown 0.3s ease-in forwards; }

		.form-input { transition: all 0.3s ease; }
		.form-input:focus { transform: translateY(-2px); }
		.submit-btn { transition: all 0.3s ease; position: relative; overflow: hidden; }
		.submit-btn:hover { transform: translateY(-2px); }
		.close-btn { transition: all 0.2s ease; }
		.close-btn:hover { transform: rotate(90deg) scale(1.1); }
	`;

	const [isClosing, setIsClosing] = useState(false);

	useEffect(() => {
		const handleEscKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isOpen) handleClose();
		};
		if (isOpen) {
			document.addEventListener('keydown', handleEscKey);
			document.body.style.overflow = 'hidden';
		}
		return () => {
			document.removeEventListener('keydown', handleEscKey);
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(event.target as Node)) handleClose();
		};
		if (isOpen) document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen]);

	const handleClose = () => {
		setIsClosing(true);
		setTimeout(() => {
			setIsClosing(false);
			onClose();
		}, 300);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleClose();
		setFormData({
			firstName: '',
			lastName: '',
			email: '',
			otherContactMethod: '',
			reasonOfContact: '',
			message: ''
		});
	};

	if (!isOpen && !isClosing) return null;

	return (
		<>
			<style>{styles}</style>
			<div
				ref={overlayRef}
				className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-overlay ${isClosing ? 'closing' : ''}`}
			>
				<div
					ref={modalRef}
					className={`bg-white rounded-3xl p-10 max-w-2xl w-full relative shadow-2xl modal-content ${isClosing ? 'closing' : ''}`}
				>
					<button
						onClick={handleClose}
						className="close-btn absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-50 hover:from-red-50 hover:to-red-100 border border-gray-200 hover:border-red-300 text-gray-600 hover:text-red-600 text-3xl font-light"
					>
						×
					</button>

					<div className="text-center mb-8">
						<div className="inline-block mb-4">
							<div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto"></div>
						</div>
						<h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
							Contact Us
						</h2>
						<p className="text-gray-500 text-sm">We'd love to hear from you. Send us a message!</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-5">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-1">First Name*</label>
								<input
									type="text"
									name="firstName"
									value={formData.firstName}
									onChange={handleInputChange}
									required
									className="form-input w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-50 hover:bg-white text-base"
									placeholder="John"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-1">Last Name*</label>
								<input
									type="text"
									name="lastName"
									value={formData.lastName}
									onChange={handleInputChange}
									required
									className="form-input w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-50 hover:bg-white text-base"
									placeholder="Doe"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-1">Email Address*</label>
							<input
								type="email"
								name="email"
								value={formData.email}
								onChange={handleInputChange}
								required
								className="form-input w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-50 hover:bg-white text-base"
								placeholder="john@example.com"
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-1">Other Contact Method</label>
							<input
								type="text"
								name="otherContactMethod"
								value={formData.otherContactMethod}
								onChange={handleInputChange}
								className="form-input w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-50 hover:bg-white text-base"
								placeholder="Phone, Telegram, Discord..."
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-1">Reason of Contact</label>
							<select
								name="reasonOfContact"
								value={formData.reasonOfContact}
								onChange={handleInputChange}
								className="form-input w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-50 hover:bg-white text-base"
							>
								<option value="">Select a reason...</option>
								<option value="support">Support</option>
								<option value="partner">Partner</option>
								<option value="merchant">Sign up as Merchant</option>
								<option value="feedback">Feedback</option>
								<option value="other">Other</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
							<textarea
								name="message"
								value={formData.message}
								onChange={handleInputChange}
								rows={4}
								className="form-input w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-50 hover:bg-white resize-none text-base"
								placeholder="Tell us more about your inquiry..."
							/>
						</div>

						<button
							type="submit"
							className="submit-btn w-full bg-purple-600 text-white py-3 rounded-lg text-base font-semibold hover:shadow-lg hover:shadow-purple-500/40"
						>
							Submit
						</button>
					</form>

					<div className="text-center mt-8 pt-5 border-t border-gray-100">
						<p className="text-gray-500 text-sm">
							<span className="font-semibold text-gray-700">Mezon</span> - Connect Freely, Share Limitlessly
						</p>
					</div>
				</div>
			</div>
		</>
	);
};
