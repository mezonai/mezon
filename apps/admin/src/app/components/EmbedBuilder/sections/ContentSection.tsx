import React from 'react';
import { useEmbedBuilder } from '../context/EmbedBuilderContext';
import { BuilderSectionWrapper, BuilderTextInput, BuilderTextarea } from '../ui/BuilderUI';

export const ContentSection: React.FC = () => {
	const { data, updateEmbed } = useEmbedBuilder();

	return (
		<BuilderSectionWrapper title="Main Content" defaultOpen={true}>
			<BuilderTextInput
				label="Title"
				placeholder="Embed Title"
				maxLength={256}
				value={data.embed?.title || ''}
				onChange={(e) => updateEmbed({ title: e.target.value })}
			/>
			<BuilderTextInput
				label="Title URL"
				placeholder="https://..."
				value={data.embed?.url || ''}
				onChange={(e) => updateEmbed({ url: e.target.value })}
			/>
			<BuilderTextarea
				label="Description"
				placeholder="Supports Markdown..."
				rows={5}
				value={data.embed?.description || ''}
				onChange={(e) => updateEmbed({ description: e.target.value })}
			/>
		</BuilderSectionWrapper>
	);
};
