export type CouponFailureKey = 'couponNotFound' | 'couponExpiredOrWrongPlan' | 'couponAlreadyUsed' | 'couponNotClanOwner' | 'couponFailed';

export const getCouponFailureKey = (error: unknown): CouponFailureKey => {
	if (typeof error !== 'object' || error === null) return 'couponFailed';

	const candidate = error as { code?: unknown; error?: unknown };
	const nestedError = candidate.error as { code?: unknown } | undefined;
	const code = typeof candidate.code === 'number' ? candidate.code : nestedError?.code;

	switch (code) {
		case 3:
			return 'couponExpiredOrWrongPlan';
		case 5:
			return 'couponNotFound';
		case 6:
			return 'couponAlreadyUsed';
		case 7:
			return 'couponNotClanOwner';
		default:
			return 'couponFailed';
	}
};
