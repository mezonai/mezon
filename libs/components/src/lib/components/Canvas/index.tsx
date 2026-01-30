import { generateE2eId } from '@mezon/utils';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useCanvas } from './useCanvas';

const CanvasEditor = lazy(() => import('./CanvasEditor').then((m) => ({ default: m.CanvasEditor })));

const TitleSkeleton = () => (
	<div className="w-full px-4 py-2 mt-[25px]">
		<div className="h-[34px] dark:bg-skeleton-dark bg-skeleton-white rounded w-3/4 animate-pulse" />
	</div>
);

const EditorSkeleton = () => (
	<div className="w-full px-4 pt-4">
		<div className="space-y-3">
			<div className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded w-full animate-pulse" />
			<div className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded w-full animate-pulse" />
			<div className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded w-5/6 animate-pulse" />
			<div className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded w-full animate-pulse" />
			<div className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded w-4/5 animate-pulse" />
		</div>
	</div>
);

function Canvas() {
	const { t } = useTranslation('canvas');
	const { title, content, canvasId, isLoading, isSaving, error, canEdit, hasChanges, updateTitle, updateContent, saveCanvas, discardChanges } =
		useCanvas();

	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const [editorKey, setEditorKey] = useState(0);

	useEffect(() => {
		if (textAreaRef.current && !isLoading) {
			textAreaRef.current.style.height = 'auto';
			textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
		}
	}, [title, isLoading]);

	if (error) {
		return (
			<div className="w-full h-[calc(100vh-50px)] max-w-[80%] flex items-center justify-center text-theme-message">
				<div className="flex flex-col items-center gap-4">
					<div className="text-red-500 text-lg">{t('error.title')}</div>
					<span>{error}</span>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="w-full h-[calc(100vh-50px)] max-w-[80%] relative">
				{isLoading ? (
					<>
						<TitleSkeleton />
						<EditorSkeleton />
					</>
				) : (
					<>
						<textarea
							ref={textAreaRef}
							placeholder={t('title.placeholder')}
							value={title}
							onChange={(e) => updateTitle(e.target.value)}
							rows={1}
							disabled={!canEdit}
							className="w-full px-4 py-2 mt-[25px] text-theme-message bg-inherit focus:outline-none text-[28px] resize-none leading-[34px] font-bold"
							data-e2e={generateE2eId('clan_page.screen.canvas_editor.input.title')}
						/>

						<div className="w-full" data-e2e={generateE2eId('clan_page.screen.canvas_editor.input.content')}>
							<Suspense fallback={<EditorSkeleton />}>
								<CanvasEditor key={`${canvasId}-${editorKey}`} content={content} editable={canEdit} onChange={updateContent} />
							</Suspense>
						</div>
					</>
				)}
			</div>

			{hasChanges &&
				canEdit &&
				createPortal(
					<div
						className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-3 py-2 rounded-[10px] bg-theme-contexify shadow-[0_4px_20px_rgba(0,0,0,0.35)] border border-white/[0.08] z-50"
						role="toolbar"
						aria-label="Canvas unsaved changes"
					>
						<button
							type="button"
							onClick={() => {
								discardChanges();
								setEditorKey((prev) => prev + 1);
							}}
							disabled={isSaving}
							className="inline-flex items-center gap-2 border-none px-[18px] py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 bg-button-hover text-theme-primary disabled:cursor-not-allowed disabled:opacity-70"
						>
							{t('actions.discardChanges')}
						</button>
						<button
							type="button"
							onClick={saveCanvas}
							disabled={isSaving}
							className="inline-flex items-center gap-2 border-none px-[18px] py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 btn-primary disabled:cursor-not-allowed disabled:opacity-70"
						>
							{isSaving ? t('actions.saving') : t('actions.save')}
						</button>
					</div>,
					document.body
				)}
		</>
	);
}

export default Canvas;
