export const validateEmail = (value: string) => {
	if (!value) {
		return 'required';
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(value)) {
		return 'invalid';
	}

	return '';
};

export const validatePassword = (value: string) => {
	if (value.length < 8) {
		return 'characters';
	}
	if (!/[A-Z]/.test(value)) {
		return 'uppercase';
	}
	if (!/[a-z]/.test(value)) {
		return 'lowercase';
	}
	if (!/[0-9]/.test(value)) {
		return 'number';
	}
	if (!/[^A-Za-z0-9]/.test(value)) {
		return 'symbol';
	}
	return '';
};

export enum ECountryCode {
	VN = '+84',
	US = '+1',
	JP = '+81'
}

export const validatePhoneNumber = (phone: string, countryCode: string) => {
	if (countryCode === '+84') {
		const phoneRegex = /^(\+84)(3|5|7|8|9)([0-9]{8})$/;
		return phoneRegex.test(parsePhoneVN(phone));
	}
	if (countryCode === '+1') {
		const phoneRegex = /^\d{10}$/;

		return phoneRegex.test(phone);
	}
	if (countryCode === '+81') {
		const phoneRegex = /^(70|80|90)\d{8}$/;
		return phoneRegex.test(phone);
	}
	return false;
};

export const parsePhoneVN = (phoneNumber: string) => {
	if (phoneNumber.startsWith('0')) {
		return `+84${phoneNumber.slice(1)}`;
	}

	if (phoneNumber.startsWith('+84')) {
		return phoneNumber;
	}

	return `+84${phoneNumber}`;
};
