import { useCallback, useMemo, useRef, useState } from 'react';
import { ContactUs } from '../mezonpage/components';

const TermOfServivePage = () => {
	const definitionsRef = useRef<HTMLDivElement | null>(null);
	const scopeRef = useRef<HTMLDivElement | null>(null);
	const accountsRef = useRef<HTMLDivElement | null>(null);
	const acceptableUseRef = useRef<HTMLDivElement | null>(null);
	const subscriptionRef = useRef<HTMLDivElement | null>(null);
	const contentRef = useRef<HTMLDivElement | null>(null);
	const terminationRef = useRef<HTMLDivElement | null>(null);
	const liabilityRef = useRef<HTMLDivElement | null>(null);
	const indemnificationRef = useRef<HTMLDivElement | null>(null);
	const privacyRef = useRef<HTMLDivElement | null>(null);
	const modificationsRef = useRef<HTMLDivElement | null>(null);
	const governingLawRef = useRef<HTMLDivElement | null>(null);
	const severabilityRef = useRef<HTMLDivElement | null>(null);
	const entireAgreementRef = useRef<HTMLDivElement | null>(null);
	const contactInfoRef = useRef<HTMLDivElement | null>(null);
	const [isContactFormOpen, setIsContactFormOpen] = useState(false);
	const [isTocOpen, setIsTocOpen] = useState(false);

	const tocItems = useMemo(
		() => [
			{ id: 'definitions', label: '1. Definitions', ref: definitionsRef },
			{ id: 'scope', label: '2. Scope of Service', ref: scopeRef },
			{ id: 'accounts', label: '3. Accounts & Use', ref: accountsRef },
			{ id: 'acceptable-use', label: '4. Acceptable Use', ref: acceptableUseRef },
			{ id: 'subscription', label: '5. Subscription & Billing', ref: subscriptionRef },
			{ id: 'content', label: '6. Content & IP', ref: contentRef },
			{ id: 'termination', label: '7. Termination', ref: terminationRef },
			{ id: 'liability', label: '8. Liability', ref: liabilityRef },
			{ id: 'indemnification', label: '9. Indemnification', ref: indemnificationRef },
			{ id: 'privacy', label: '10. Privacy', ref: privacyRef },
			{ id: 'modifications', label: '11. Modifications', ref: modificationsRef },
			{ id: 'governing-law', label: '12. Governing Law', ref: governingLawRef },
			{ id: 'severability', label: '13. Severability', ref: severabilityRef },
			{ id: 'entire-agreement', label: '14. Entire Agreement', ref: entireAgreementRef },
			{ id: 'contact', label: '15. Contact', ref: contactInfoRef }
		],
		[]
	);

	const handleScrollToSection = useCallback(
		(id: string) => {
			const target = tocItems.find((item) => item.id === id);
			if (target?.ref.current) {
				target.ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		},
		[tocItems]
	);

	return (
		<div className="min-h-screen bg-white">
			<div className="bg-gradient-to-r from-[#8960e0] via-[#7e6eea] to-[#6e7cf3] text-white">
				<div className="max-w-5xl mx-auto px-6 py-12">
					<p className="uppercase tracking-[0.35em] text-sm font-semibold mb-4">Legal</p>
					<h1 className="text-4xl md:text-5xl font-bold leading-tight">Mezon Terms of Service</h1>
					<p className="mt-4 text-white/80 text-lg max-w-3xl">
						Understand the rules that govern your use of Mezon. Jump directly to any section using the navigation below.
					</p>
					<p className="mt-6 text-sm text-white/70">Last updated: 2025-11-17</p>
				</div>
			</div>

			<div className="bg-white border-b border-gray-100">
				<div className="max-w-5xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between md:hidden">
						<p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Sections</p>
						<button
							onClick={() => setIsTocOpen((prev) => !prev)}
							className="px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
						>
							{isTocOpen ? 'Hide' : 'Show'}
						</button>
					</div>
					<div className={`mt-3 md:mt-0 ${isTocOpen ? 'flex' : 'hidden'} flex-col gap-2 md:flex md:flex-row md:flex-wrap md:gap-2`}>
						{tocItems.map((item) => (
							<button
								key={item.id}
								onClick={() => {
									handleScrollToSection(item.id);
									setIsTocOpen(false);
								}}
								className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
							>
								{item.label}
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="max-w-4xl mx-auto px-6 py-12">
				<p className="text-gray-700 leading-relaxed mb-6 select-text">
					By accessing or using our services, you ("you", "your", "User") agree to be bound by these Terms of Service (these "Terms"). If
					you do not agree to all of these Terms, you may not access or use the Mezon platform (the "Service"). Your use of the Service
					indicates your acceptance of these Terms.
				</p>

				<div className="prose prose-lg max-w-none select-text">
					<section className="mb-8" id="definitions" ref={definitionsRef}>
						<h2 className="text-2xl font-semibold text-gray-900 mb-4 select-text">1. Definitions</h2>
						<div className="space-y-3 text-gray-700 select-text">
							<p>
								<strong>"Account"</strong> means the unique user account created for you to access the Service.
							</p>
							<p>
								<strong>"Content"</strong> means any text, images, audio, video, data or other materials uploaded to or transmitted
								through the Service by you or other users.
							</p>
							<p>
								<strong>"User Applications"</strong> means applications developed by you or other Users via Mezon's SDK or low-code
								flow, launched on Mezon under the "Develop, Launch and Earn" feature.
							</p>
							<p>
								<strong>"Subscription Plan"</strong> means any paid plan you choose to use for the Service (if applicable).
							</p>
							<p>
								<strong>"We", "us", "our"</strong> refers to Mezon (or its legal entity).
							</p>
							<p>
								<strong>"Service"</strong> means the Mezon platform, including the Workstation, Ecosystem, AI Agent and any related
								features.
							</p>
						</div>
					</section>

					<section className="mb-8" id="scope" ref={scopeRef}>
						<h2 className="text-2xl font-semibold text-gray-900 mb-4 select-text">2. Scope of Service</h2>
						<p className="text-gray-700 leading-relaxed mb-4 select-text">
							We provide you the Service subject to these Terms. We may add, change, suspend or remove features at our discretion,
							including introducing new subscription plans, modifying pricing, or restricting access to certain modules.
						</p>
						<p className="text-gray-700 leading-relaxed select-text">
							You understand and agree that the Service is provided on an "AS IS" and "AS AVAILABLE" basis. We do not guarantee
							uninterrupted or error-free operation, and we reserve the right to suspend or terminate Service for maintenance, upgrades,
							or for any other reason.
						</p>
					</section>

					<section className="mb-8" id="accounts" ref={accountsRef}>
						<h2 className="text-2xl font-semibold text-gray-900 mb-4 select-text">3. Accounts, Registration & Use</h2>
						<div className="space-y-4 text-gray-700 select-text">
							<p>
								To use certain parts of the Service you must register for an Account and provide accurate, complete and up-to-date
								information.
							</p>
							<p>
								You are responsible for maintaining the confidentiality of your credentials and for all activities under your Account.
								You must notify us immediately if you suspect any unauthorized use of your Account.
							</p>
							<p>
								You may not use the Service if you are under the age required by applicable law or if you are unable to form legally
								binding contracts.
							</p>
							<p>You shall use the Service only for lawful purposes and in compliance with these Terms.</p>
						</div>
					</section>

					<section className="mb-8" id="acceptable-use" ref={acceptableUseRef}>
						<h2 className="text-2xl font-semibold text-gray-900 mb-4 select-text">4. Acceptable Use & Prohibited Conduct</h2>
						<p className="text-gray-700 mb-4 select-text">You agree not to engage in any of the following:</p>
						<ul className="list-disc pl-6 space-y-2 text-gray-700 select-text">
							<li>Use the Service in violation of any applicable law, regulation or third-party right.</li>
							<li>Upload, post or transmit any Content that is unlawful, infringing, defamatory, obscene, offensive or harmful.</li>
							<li>
								Reverse-engineer, decompile or attempt to derive the source code of the Service (except to the extent permitted by
								law).
							</li>
							<li>Interfere with or attempt to disrupt the Service or any user's use of the Service.</li>
							<li>Use the Service to develop applications or features that compete with the Service unless explicitly permitted.</li>
							<li>
								Use automated means (e.g., robots, scrapers) to access or use the Service except in accordance with our API policies
								(if any).
							</li>
							<li>Share or resell access to the Service without our express permission.</li>
						</ul>
						<p className="text-gray-700 mt-4 select-text">
							We reserve the right to suspend or terminate your Account (or features thereof) if you breach these Terms or engage in
							misconduct.
						</p>
					</section>

					<section className="mb-8" id="subscription" ref={subscriptionRef}>
						<h2 className="text-2xl font-semibold text-gray-900 mb-4 select-text">5. Subscription, Billing & Payments</h2>
						<ul className="list-disc pl-6 space-y-2 text-gray-700 select-text">
							<li>If you select a Subscription Plan, you agree to pay all fees applicable to the plan.</li>
							<li>You authorize us (or our payment processor) to charge your chosen payment method.</li>
							<li>All fees are non-refundable unless otherwise stated.</li>
							<li>
								We may change our fees, payment terms or billing methods at any time; we will notify you in advance when required by
								applicable law.
							</li>
							<li>If you fail to pay fees when due, we may suspend or terminate your access to the paid features of the Service.</li>
						</ul>
					</section>

					<section className="mb-8" id="content" ref={contentRef}>
						<h2 className="text-2xl font-semibold text-gray-900 mb-4 select-text">
							6. Content, User Applications & Intellectual Property
						</h2>
						<div className="space-y-4 text-gray-700 select-text">
							<p>
								You retain all right, title and interest in the Content you upload or transmit through the Service. You grant us a
								worldwide, royalty-free, non-exclusive license to use, display, reproduce, modify, and distribute your Content to
								enable the Service.
							</p>
							<p>
								For User Applications developed via Mezon's SDK or low-code flow: you represent and warrant you have all required
								rights in such applications and you grant us the right to distribute them as part of the Ecosystem.
							</p>
							<p>
								We own all right, title and interest in the Service, our trademarks, logos, software, platform architecture and
								related intellectual property. You may not use our trademarks without our prior written consent.
							</p>
							<p>
								If you submit feedback, suggestions or ideas regarding the Service ("Feedback"), you grant us a perpetual,
								irrevocable, worldwide license to use and exploit that Feedback without compensation to you.
							</p>
						</div>
					</section>

					<section className="mb-8" id="termination" ref={terminationRef}>
						<h2 className="text-2xl font-semibold text-gray-900 mb-4 select-text">7. Termination & Suspension</h2>
						<div className="space-y-4 text-gray-700 select-text">
							<p>
								We may suspend or terminate your Account or your access to the Service (or certain features) at any time, with or
								without cause, upon notice to you (if feasible).
							</p>
							<p>
								Upon termination, your right to use the Service ceases immediately. You may delete your Content; after termination we
								may delete or retain your Content in accordance with our data retention and privacy policies.
							</p>
							<p>Termination does not relieve you of your obligation to pay any fees accrued before termination.</p>
						</div>
					</section>

					<section className="mb-8" id="liability" ref={liabilityRef}>
						<h2 className="text-2xl font-semibold text-gray-900 mb-4 select-text">8. Disclaimers & Limitation of Liability</h2>
						<div className="space-y-4 text-gray-700 select-text">
							<p>
								To the maximum extent permitted by law, we disclaim all warranties, whether express or implied, including
								merchantability, fitness for a particular purpose, uninterrupted service, or non-infringement.
							</p>
							<p>
								In no event shall we (or our affiliates, officers, employees) be liable for any indirect, incidental, special,
								consequential or punitive damages, including loss of profits, data, revenue, business or goodwill, even if we were
								advised of the possibility of such damages.
							</p>
							<p>
								Our total liability to you for any claim arising out of or relating to the Service shall not exceed the amount you
								paid us in the 12 months preceding the event giving rise to the claim (or, if none, USD 100).
							</p>
							<p>
								Some jurisdictions do not allow the exclusion or limitation of certain warranties or liabilities, so some of the above
								limitations may not apply to you.
							</p>
						</div>
					</section>

					<section className="mb-8" id="indemnification" ref={indemnificationRef}>
						<h2 className="text-2xl font-semibold text-gray-900 mb-4 select-text">9. Indemnification</h2>
						<p className="text-gray-700 leading-relaxed select-text">
							You agree to defend, indemnify and hold harmless us and our affiliates, officers, directors, employees and agents from and
							against any claims, losses, damages, liabilities and expenses (including legal fees) arising out of: (a) your use of the
							Service; (b) your Content or User Applications; (c) your violation of these Terms; or (d) your violation of third-party
							rights.
						</p>
					</section>

					<section className="mb-8" id="privacy" ref={privacyRef}>
						<h2 className="text-2xl font-semibold text-gray-900 mb-4 select-text">10. Privacy</h2>
						<p className="text-gray-700 leading-relaxed select-text">
							Your use of the Service is also governed by our Privacy Policy [link to Privacy Policy]. Please review it carefully. By
							using the Service you consent to our collection and use of your information as described therein.
						</p>
					</section>

					<section className="mb-8" id="modifications" ref={modificationsRef}>
						<h2 className="text-2xl font-semibold text-gray-900 mb-4 select-text">11. Modifications to Terms</h2>
						<p className="text-gray-700 leading-relaxed select-text">
							We may revise these Terms from time to time. When we do, we will post the updated Terms and indicate the "Last updated"
							date. If you continue to use the Service after the revised Terms are posted, you agree to the new Terms. If you do not
							agree to the changes, you must stop using the Service.
						</p>
					</section>

					<section className="mb-8" id="governing-law" ref={governingLawRef}>
						<h2 className="text-2xl font-semibold text-gray-900 mb-4 select-text">12. Governing Law & Dispute Resolution</h2>
						<div className="space-y-4 text-gray-700 select-text">
							<p>
								These Terms and your use of the Service shall be governed by and construed in accordance with the laws of
								[Jurisdiction – e.g., Singapore] without regard to its conflict of law provisions.
							</p>
							<p>
								Any dispute arising out of or relating to these Terms or the Service shall be finally settled by arbitration in [City,
								Country] in accordance with the rules of [Arbitration Institution]. If required by law, you may seek relief in courts
								of competent jurisdiction.
							</p>
							<p>You and we both waive any right to a jury trial or class action (to the extent permitted by law).</p>
						</div>
					</section>

					<section className="mb-8" id="severability" ref={severabilityRef}>
						<h2 className="text-2xl font-semibold text-gray-900 mb-4 select-text">13. Severability & Waiver</h2>
						<p className="text-gray-700 leading-relaxed select-text">
							If any provision of these Terms is invalid or unenforceable under applicable law, the remaining provisions will continue
							in full force and effect. No waiver by us of any right or breach will be deemed a further or continuing waiver.
						</p>
					</section>

					<section className="mb-8" id="entire-agreement" ref={entireAgreementRef}>
						<h2 className="text-2xl font-semibold text-gray-900 mb-4 select-text">14. Entire Agreement</h2>
						<p className="text-gray-700 leading-relaxed select-text">
							These Terms, together with any documents they incorporate by reference (e.g., Privacy Policy), constitute the entire
							agreement between you and us regarding the Service, superseding any prior agreements between you and us relating to the
							Service.
						</p>
					</section>

					<section className="mb-8" id="contact" ref={contactInfoRef}>
						<h2 className="text-2xl font-semibold text-gray-900 mb-4 select-text">15. Contact Information</h2>
						<p className="text-gray-700 mb-4 select-text">
							If you have any questions about these Terms, please contact us at:{' '}
							<span
								onClick={() => setIsContactFormOpen(true)}
								className="cursor-pointer underline text-purple-600 hover:text-purple-800 font-semibold"
							>
								Contact Mezon
							</span>
						</p>
						<div className="text-gray-700 select-text">
							<p>Address: 2nd Floor, CT3 The Pride, To Huu Street, Ha Dong, Ha Noi, Vietnam</p>
							<p>
								Email:{' '}
								<a href="mailto:hello@mezon.vn" className="text-blue-600 hover:underline">
									hello@mezon.vn
								</a>
							</p>
							<p>Phone: (+84) 2466874606</p>
						</div>
					</section>
				</div>
			</div>
			<ContactUs isOpen={isContactFormOpen} onClose={() => setIsContactFormOpen(false)} />
		</div>
	);
};

export default TermOfServivePage;
