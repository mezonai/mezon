export function AttachmentSendingIndicator({ className = '' }: { className?: string }) {
	return (
		<div
			className={`absolute inset-0 flex items-center justify-center pointer-events-none z-[2] ${className}`}
			aria-hidden
		>
			<div className="w-8 h-8 border-2 border-textSecondary800 dark:border-textSecondary border-t-transparent rounded-full animate-spin" />
		</div>
	);
}
