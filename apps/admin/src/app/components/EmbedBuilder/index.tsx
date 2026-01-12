import React from 'react';
import { EmbedPreview } from './EmbedPreview';
import type { IEmbedData } from './context/EmbedBuilderContext';
import { EmbedBuilderProvider, useEmbedBuilder } from './context/EmbedBuilderContext';
import { ActionsSection } from './sections/ActionsSection';
import { ContentSection } from './sections/ContentSection';
import { FieldsSection } from './sections/FieldsSection';
import { FooterSection } from './sections/FooterSection';
import { GeneralSection } from './sections/GeneralSection';
import { MediaSection } from './sections/MediaSection';
import { BuilderButton } from './ui/BuilderUI';

interface EmbedBuilderProps {
	initialValue?: IEmbedData;
	onChange?: (embed: IEmbedData) => void;
}

const EmbedBuilderContent: React.FC<{ onChange?: (embed: IEmbedData) => void }> = ({ onChange }) => {
	const { data, setData } = useEmbedBuilder();

	const onChangeRef = React.useRef(onChange);
	const isFirstRenderRef = React.useRef(true);

	React.useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	React.useEffect(() => {
		if (isFirstRenderRef.current) {
			isFirstRenderRef.current = false;
			return;
		}
		onChangeRef.current?.(data);
	}, [data]);

	return (
		<div className="flex flex-col w-full bg-white rounded-lg shadow-sm h-full">
			{/* Toolbar */}
			<div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-gray-50 flex-shrink-0">
				<h2 className="font-bold text-gray-700">Embed Builder</h2>
				<div className="flex gap-2">
					<BuilderButton variant="ghost" onClick={() => setData({ embed: { fields: [] }, components: [] })}>
						Clear
					</BuilderButton>
				</div>
			</div>

			<div className="flex flex-1 min-h-0">
				{/* Editor Content */}
				<div className="w-full lg:w-1/2 flex flex-col bg-white border-r border-gray-200 overflow-x-hidden custom-scrollbar-auto">
					<div className="p-6 space-y-6">
						<GeneralSection />
						<ContentSection />
						<FieldsSection />
						<MediaSection />
						<FooterSection />
						<ActionsSection />
					</div>
				</div>

				{/* Preview Section */}
				<div className="hidden lg:block w-1/2 bg-gray-50 overflow-x-hidden custom-scrollbar-auto">
					<EmbedPreview />
				</div>
			</div>
		</div>
	);
};

export const EmbedBuilder: React.FC<EmbedBuilderProps> = ({ initialValue, onChange }) => {
	return (
		<EmbedBuilderProvider initialData={initialValue}>
			<EmbedBuilderContent onChange={onChange} />
		</EmbedBuilderProvider>
	);
};
