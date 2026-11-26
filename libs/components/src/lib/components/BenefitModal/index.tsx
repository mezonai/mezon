import { MezonIcon, MzIcons20 } from '@mezon/ui';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalLayout from '../Modal';
import ModalConfirm from '../ModalConfirm';

type Feature = {
	title: string;
	description: string;
};

type PlanVariant = 'standard' | 'user' | 'clan';

type Plan = {
	name: string;
	label: string;
	category: string;
	description: string;
	price: string;
	period: string;
	priceNote?: string;
	featuresTitle: string;
	features: Feature[];
	buttonText: string;
	variant: PlanVariant;
};

export type BenefitPlanId = Extract<PlanVariant, 'user' | 'clan'>;
export type BenefitConfirmationAction = 'purchase' | 'coupon';

export type BenefitConfirmation = {
	title: string;
	message: string;
	buttonName: string;
	processingButtonName: string;
	buttonColor?: string;
};

export type CouponValidationResult = {
	success: boolean;
	message?: string;
};

export type BenefitModalProps = {
	open: boolean;
	onClose: () => void;
	onConfirmPlan?: (plan: BenefitPlanId) => Promise<boolean | void> | boolean | void;
	getConfirmation?: (plan: BenefitPlanId, action: BenefitConfirmationAction) => BenefitConfirmation;
	onApplyCoupon?: (plan: BenefitPlanId, couponCode: string) => Promise<CouponValidationResult> | CouponValidationResult;
	availablePlans?: BenefitPlanId[];
	couponPlans?: BenefitPlanId[];
};

const plans: Plan[] = [
	{
		name: 'plans.standard.name',
		label: 'plans.standard.label',
		category: 'plans.standard.category',
		description: 'plans.standard.description',
		price: 'plans.standard.price',
		period: 'plans.standard.period',
		featuresTitle: 'plans.standard.featuresTitle',
		buttonText: 'plans.standard.buttonText',
		variant: 'standard',
		features: [
			{ title: 'plans.standard.features.voice.title', description: 'plans.standard.features.voice.description' },
			{ title: 'plans.standard.features.livestream.title', description: 'plans.standard.features.livestream.description' },
			{ title: 'plans.standard.features.soundEffects.title', description: 'plans.standard.features.soundEffects.description' },
			{ title: 'plans.standard.features.storage.title', description: 'plans.standard.features.storage.description' }
		]
	},
	{
		name: 'plans.user.name',
		label: 'plans.user.label',
		category: 'plans.user.category',
		description: 'plans.user.description',
		price: 'plans.user.price',
		period: 'plans.user.period',
		priceNote: 'plans.user.priceNote',
		featuresTitle: 'plans.user.featuresTitle',
		buttonText: 'plans.user.buttonText',
		variant: 'user',
		features: [
			{ title: 'plans.user.features.meetings.title', description: 'plans.user.features.meetings.description' },
			{ title: 'plans.user.features.soundEffects.title', description: 'plans.user.features.soundEffects.description' },
			{ title: 'plans.user.features.storage.title', description: 'plans.user.features.storage.description' },
			{ title: 'plans.user.features.badge.title', description: 'plans.user.features.badge.description' },
			{ title: 'plans.user.features.bandwidth.title', description: 'plans.user.features.bandwidth.description' }
		]
	},
	{
		name: 'plans.clan.name',
		label: 'plans.clan.label',
		category: 'plans.clan.category',
		description: 'plans.clan.description',
		price: 'plans.clan.price',
		period: 'plans.clan.period',
		priceNote: 'plans.clan.priceNote',
		featuresTitle: 'plans.clan.featuresTitle',
		buttonText: 'plans.clan.buttonText',
		variant: 'clan',
		features: [
			{ title: 'plans.clan.features.livestream.title', description: 'plans.clan.features.livestream.description' },
			{ title: 'plans.clan.features.events.title', description: 'plans.clan.features.events.description' },
			{ title: 'plans.clan.features.webinar.title', description: 'plans.clan.features.webinar.description' },
			{ title: 'plans.clan.features.storage.title', description: 'plans.clan.features.storage.description' },
			{ title: 'plans.clan.features.soundboard.title', description: 'plans.clan.features.soundboard.description' },
			{ title: 'plans.clan.features.customization.title', description: 'plans.clan.features.customization.description' }
		]
	}
];

const cardStyles: Record<PlanVariant, string> = {
	standard: 'border-[#392347] bg-[linear-gradient(155deg,#191020_0%,#100b16_78%)] shadow-[0_18px_50px_rgba(0,0,0,.28)]',
	user: 'border-fuchsia-400/70 bg-[linear-gradient(155deg,#28143b_0%,#1a1027_52%,#110b19_100%)] shadow-[0_0_0_1px_rgba(217,70,239,.16),0_0_44px_rgba(168,85,247,.26)]',
	clan: 'border-[#392347] bg-[linear-gradient(155deg,#191020_0%,#100b16_78%)] shadow-[0_18px_50px_rgba(0,0,0,.28)]'
};

const accentStyles: Record<PlanVariant, string> = {
	standard: 'text-slate-300',
	user: 'text-fuchsia-300',
	clan: 'text-cyan-300'
};

function FeatureList({ features, variant }: { features: Feature[]; variant: PlanVariant }) {
	const checkStyles: Record<PlanVariant, string> = {
		standard: 'border-slate-500/60 bg-slate-500/20 text-slate-200',
		user: 'border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-200',
		clan: 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300'
	};

	return (
		<ul className="mt-4 space-y-3.5">
			{features.map((feature) => (
				<li key={feature.title} className="flex items-start gap-2.5">
					<span
						className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${checkStyles[variant]}`}
					>
						<MezonIcon icon={MzIcons20.mzCheck} className="!h-[11px] !w-[11px]" />
					</span>
					<p className="text-[12px] leading-[1.55] text-slate-300">
						<span className="font-semibold text-slate-100">{feature.title}</span> {feature.description}
					</p>
				</li>
			))}
		</ul>
	);
}

function PlanCard({
	plan,
	onSelectPlan,
	availablePlans,
	showCoupon,
	couponCode,
	onCouponCodeChange,
	onCouponSubmit,
	couponFeedback,
	isApplyingCoupon
}: {
	plan: Plan;
	onSelectPlan?: (plan: BenefitPlanId) => void;
	availablePlans?: BenefitModalProps['availablePlans'];
	showCoupon?: boolean;
	couponCode?: string;
	onCouponCodeChange?: (value: string) => void;
	onCouponSubmit?: (plan: BenefitPlanId, event: FormEvent<HTMLFormElement>) => void;
	couponFeedback?: CouponValidationResult | null;
	isApplyingCoupon?: boolean;
}) {
	const { t } = useTranslation('benefitModal');
	const isUser = plan.variant === 'user';
	const isClan = plan.variant === 'clan';
	const couponPlan: BenefitPlanId | null = isUser ? 'user' : isClan ? 'clan' : null;
	const isSelectable = plan.variant !== 'standard' && Boolean(onSelectPlan) && (!availablePlans || availablePlans.includes(plan.variant));

	return (
		<article className={`relative flex h-full min-h-[570px] flex-col rounded-[22px] border p-5 sm:p-6 ${cardStyles[plan.variant]}`}>
			{isUser && (
				<div className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/20 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 px-4 py-1 text-[10px] font-bold tracking-[0.13em] text-white shadow-[0_5px_24px_rgba(192,38,211,.45)]">
					<MezonIcon icon={MzIcons20.mzSparkles} className="!h-[13px] !w-[13px]" />
					{t('popular')}
				</div>
			)}

			<div className="flex min-h-9 items-center justify-between gap-3">
				{plan.variant === 'standard' ? (
					<span className="rounded-full border border-slate-600/70 bg-slate-700/40 px-3 py-1 text-[10px] font-bold tracking-wide text-slate-400">
						{t(plan.label)}
					</span>
				) : (
					<span
						className={`flex h-9 w-9 items-center justify-center rounded-xl border ${isUser ? 'border-fuchsia-400/70 text-fuchsia-300' : 'border-indigo-400/50 bg-indigo-500/10 text-indigo-300'}`}
					>
						{isUser ? (
							<MezonIcon icon={MzIcons20.mzOwner} className="!h-[18px] !w-[18px]" />
						) : (
							<MezonIcon icon={MzIcons20.mzMembers} className="!h-[19px] !w-[19px]" />
						)}
					</span>
				)}
				{plan.variant !== 'standard' && (
					<span
						className={`max-w-[68%] truncate rounded-full border px-3 py-1 text-[9px] font-bold tracking-wide ${isUser ? 'border-fuchsia-400/35 bg-fuchsia-500/10 text-fuchsia-200' : 'border-indigo-400/35 bg-indigo-500/10 text-indigo-200'}`}
					>
						{t(plan.label)}
					</span>
				)}
			</div>

			<div className="mt-5">
				<p className={`text-[9px] font-bold tracking-[0.12em] ${accentStyles[plan.variant]}`}>{t(plan.category)}</p>
				<div className="mt-1 flex flex-wrap items-center gap-2">
					<h2 className="text-[23px] font-bold leading-tight tracking-tight text-white">{t(plan.name)}</h2>
					{isUser && (
						<span className="rounded-md border border-fuchsia-300/35 bg-fuchsia-500/15 px-2 py-0.5 text-[9px] font-semibold text-fuchsia-200">
							{t('vipBadge')}
						</span>
					)}
				</div>
				<p className="mt-2 min-h-[36px] text-[11px] leading-relaxed text-slate-400">{t(plan.description)}</p>
				<div className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
					<span className="text-[30px] font-bold tracking-tight text-white">{t(plan.price)}</span>
					<span className="text-[11px] text-slate-400">{t(plan.period)}</span>
				</div>
				{plan.priceNote && (
					<p className={`mt-1 text-[10px] leading-relaxed ${isUser ? 'text-fuchsia-200/80' : 'text-slate-400'}`}>
						{isUser && <span className="mr-1 text-emerald-400">●</span>}
						{t(plan.priceNote)}
					</p>
				)}
			</div>

			<div className="my-5 border-t border-purple-400/15" />
			<button
				type="button"
				disabled={!isSelectable}
				onClick={() => plan.variant !== 'standard' && onSelectPlan?.(plan.variant)}
				className={`flex h-11 w-full items-center justify-center rounded-xl border px-3 text-center text-[11px] font-bold transition duration-200 ${
					plan.variant === 'user'
						? 'border-fuchsia-300/60 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white shadow-[0_8px_25px_rgba(168,85,247,.22)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'
						: plan.variant === 'clan'
							? 'border-purple-400/40 bg-purple-500/10 text-purple-100 hover:border-purple-300/70 hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50'
							: 'cursor-default border-slate-500/30 bg-slate-500/10 text-slate-400'
				}`}
			>
				{t(plan.buttonText)}
			</button>
			{couponPlan && showCoupon && (
				<form
					onSubmit={(event) => onCouponSubmit?.(couponPlan, event)}
					className={`mt-3 rounded-xl border p-3 ${isUser ? 'border-fuchsia-500/20 bg-fuchsia-500/[0.04]' : 'border-cyan-500/20 bg-cyan-500/[0.04]'}`}
				>
					<label
						htmlFor={`benefit-${couponPlan}-coupon-code`}
						className={`mb-2 block text-[10px] font-semibold tracking-wide ${isUser ? 'text-fuchsia-200' : 'text-cyan-200'}`}
					>
						{t('coupon.label')}
					</label>
					<div className="flex gap-2">
						<input
							id={`benefit-${couponPlan}-coupon-code`}
							type="text"
							value={couponCode || ''}
							onChange={(event) => onCouponCodeChange?.(event.target.value)}
							placeholder={t('coupon.placeholder')}
							className={`min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-500 ${isUser ? 'focus:border-fuchsia-400/50' : 'focus:border-cyan-400/50'}`}
							autoComplete="off"
						/>
						<button
							type="submit"
							disabled={!couponCode?.trim() || isApplyingCoupon}
							className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${isUser ? 'border-fuchsia-400/35 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/20' : 'border-cyan-400/35 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20'}`}
						>
							{isApplyingCoupon ? t('coupon.processing') : t('coupon.apply')}
						</button>
					</div>
					{couponFeedback && (
						<p className={`mt-2 text-[10px] ${couponFeedback.success ? 'text-emerald-400' : 'text-rose-400'}`}>
							{couponFeedback.message || t(couponFeedback.success ? 'coupon.applied' : 'coupon.invalid')}
						</p>
					)}
				</form>
			)}

			<div className="mt-5">
				<h3 className={`text-[9px] font-bold tracking-[0.1em] ${isClan ? 'text-cyan-300' : isUser ? 'text-fuchsia-300' : 'text-purple-200'}`}>
					{t(plan.featuresTitle)}
				</h3>
				<FeatureList
					features={plan.features.map((feature) => ({ title: t(feature.title), description: t(feature.description) }))}
					variant={plan.variant}
				/>
			</div>

			<div className="mt-auto pt-5">
				<div className="border-t border-purple-400/10 pt-4">
					{isUser && <MezonIcon icon={MzIcons20.mzShield} className="text-fuchsia-300" />}
					{isClan && <MezonIcon icon={MzIcons20.mzOwner} className="text-cyan-300" />}
				</div>
			</div>
		</article>
	);
}

export default function BenefitModal({
	open,
	onClose,
	onConfirmPlan,
	getConfirmation,
	onApplyCoupon,
	availablePlans,
	couponPlans
}: BenefitModalProps) {
	const { t } = useTranslation('benefitModal');
	const [confirmPlan, setConfirmPlan] = useState<BenefitPlanId | null>(null);
	const [isConfirming, setIsConfirming] = useState(false);
	const [couponCodes, setCouponCodes] = useState<Record<BenefitPlanId, string>>({ user: '', clan: '' });
	const [applyingCouponPlan, setApplyingCouponPlan] = useState<BenefitPlanId | null>(null);
	const [couponFeedbackByPlan, setCouponFeedbackByPlan] = useState<Record<BenefitPlanId, CouponValidationResult | null>>({
		user: null,
		clan: null
	});
	const [confirmAction, setConfirmAction] = useState<BenefitConfirmationAction>('purchase');
	const enabledCouponPlans = couponPlans ?? availablePlans;
	const confirmation = confirmPlan ? getConfirmation?.(confirmPlan, confirmAction) : undefined;

	const handleSelectPlan = (plan: BenefitPlanId) => {
		setConfirmAction('purchase');
		setConfirmPlan(plan);
	};

	const closeConfirmation = () => {
		setConfirmPlan(null);
		setConfirmAction('purchase');
	};
	const handleCancelConfirmation = () => closeConfirmation();

	const handleConfirmPlan = async () => {
		if (!confirmPlan || isConfirming || applyingCouponPlan) return;
		const planToConfirm = confirmPlan;
		const actionToConfirm = confirmAction;

		setIsConfirming(true);
		try {
			if (actionToConfirm === 'coupon') {
				const normalizedCode = couponCodes[planToConfirm].trim();
				if (!normalizedCode) return;
				if (!onApplyCoupon) {
					setCouponFeedbackByPlan((current) => ({
						...current,
						[planToConfirm]: { success: false, message: t('coupon.unavailable') }
					}));
					closeConfirmation();
					return;
				}
				setApplyingCouponPlan(planToConfirm);
				const result = await onApplyCoupon(planToConfirm, normalizedCode);
				setCouponFeedbackByPlan((current) => ({ ...current, [planToConfirm]: result }));
				if (result.success) setCouponCodes((current) => ({ ...current, [planToConfirm]: '' }));
				closeConfirmation();
				return;
			}

			if (!onConfirmPlan) return;
			const result = await onConfirmPlan(planToConfirm);
			if (result !== false) {
				handleCancelConfirmation();
				onClose();
			}
		} catch {
			if (actionToConfirm === 'coupon') {
				setCouponFeedbackByPlan((current) => ({
					...current,
					[planToConfirm]: { success: false, message: t('coupon.processingFailed') }
				}));
				closeConfirmation();
			}
		} finally {
			setApplyingCouponPlan(null);
			setIsConfirming(false);
		}
	};

	const handleRequestCoupon = (plan: BenefitPlanId, event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!couponCodes[plan].trim() || applyingCouponPlan || isConfirming) return;
		setCouponFeedbackByPlan((current) => ({ ...current, [plan]: null }));
		setConfirmAction('coupon');
		setConfirmPlan(plan);
	};

	if (!open) return null;

	return (
		<ModalLayout onClose={confirmPlan ? () => undefined : onClose}>
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="benefit-modal-title"
				className="relative flex h-[83vh] max-h-[83vh] w-full max-w-[1240px] flex-col overflow-hidden rounded-[26px] border border-[#493153] bg-[#0b0810] p-4 text-white shadow-[0_24px_100px_rgba(0,0,0,.72)] sm:p-6 lg:p-7"
			>
				<div className="pointer-events-none absolute inset-x-1/4 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,.18),transparent_70%)]" />
				<button
					type="button"
					onClick={() => (confirmPlan ? handleCancelConfirmation() : onClose())}
					aria-label={t('close')}
					className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl leading-none text-slate-300 transition hover:bg-white/10 hover:text-white sm:right-5 sm:top-5"
				>
					<MezonIcon icon={MzIcons20.mzClose} className="text-slate-300" />
				</button>

				<header className="relative mx-auto mb-7 max-w-[720px] px-2 text-center sm:mb-8">
					<div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-purple-300/20 bg-purple-400/10 px-3 py-1 text-[9px] font-bold tracking-[0.18em] text-purple-200">
						<MezonIcon icon={MzIcons20.mzSparkles} className="!h-3 !w-3" /> {t('membershipLabel')}
					</div>
					<h1
						id="benefit-modal-title"
						className="text-[27px] font-extrabold leading-[1.12] tracking-tight text-white sm:text-[38px] lg:text-[44px]"
					>
						{t('heading')}
						<br />
						<span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
							{t('productName')}
						</span>
					</h1>
					<p className="mx-auto mt-3 max-w-[620px] text-[12px] leading-relaxed text-slate-300 sm:text-sm">{t('description')}</p>
				</header>

				<div className="relative min-h-0 flex-1 overflow-y-auto thread-scroll px-1 pb-4 sm:px-2">
					<div className="grid grid-cols-1 items-stretch gap-5 pt-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
						{plans.map((plan) => (
							<div key={plan.variant} className={plan.variant === 'user' ? 'relative z-[1] xl:-my-2' : ''}>
								<PlanCard
									plan={plan}
									onSelectPlan={onConfirmPlan ? handleSelectPlan : undefined}
									availablePlans={availablePlans}
									showCoupon={
										plan.variant !== 'standard' &&
										Boolean(onApplyCoupon) &&
										(!enabledCouponPlans || enabledCouponPlans.includes(plan.variant))
									}
									couponCode={plan.variant === 'standard' ? '' : couponCodes[plan.variant]}
									onCouponCodeChange={(value) => {
										if (plan.variant === 'standard') return;
										const couponPlan = plan.variant;
										setCouponCodes((current) => ({ ...current, [couponPlan]: value }));
										setCouponFeedbackByPlan((current) => ({ ...current, [couponPlan]: null }));
									}}
									onCouponSubmit={handleRequestCoupon}
									couponFeedback={plan.variant === 'standard' ? null : couponFeedbackByPlan[plan.variant]}
									isApplyingCoupon={applyingCouponPlan === plan.variant || isConfirming}
								/>
							</div>
						))}
					</div>
				</div>

				{confirmPlan && (
					<div
						className="absolute inset-0 z-20 flex items-center justify-center rounded-[26px] bg-black/75 p-3 sm:p-5"
						onKeyDown={(event) => {
							if (event.key === 'Escape') {
								event.stopPropagation();
								handleCancelConfirmation();
							}
						}}
					>
						<div className="w-full max-w-[440px]" onClick={(event) => event.stopPropagation()}>
							<ModalConfirm
								handleCancel={handleCancelConfirmation}
								handleConfirm={handleConfirmPlan}
								title={confirmation?.title}
								buttonName={isConfirming ? confirmation?.processingButtonName : confirmation?.buttonName}
								buttonColor={confirmation?.buttonColor || 'bg-indigo-600 hover:bg-indigo-700'}
								customTitle={confirmation?.message}
								disableEnterKey
							/>
						</div>
					</div>
				)}
			</section>
		</ModalLayout>
	);
}
