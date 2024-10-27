import { Summarizer, type SumSummarize } from './0.constructor';

export class SummarizeDependency extends Summarizer {
	summarize: SumSummarize['summarize'] = async (parsedHtml) => {
		if (!this.bindings) {
			this.error('No bindings specified', this.bindings);
			throw Error('No bindings specified');
		}

		parsedHtml = parsedHtml || this.parsedHtml;
		let responseText = '';
		try {
			//@cf/facebook/bart-large-cnn
			const response = (await this.bindings.AI.run('@cf/meta/llama-3.1-8b-instruct', {
				prompt: 'Can you create a summary of this article?: ' + parsedHtml,
			})) as { response: string };
			responseText = response.response;
		} catch (e) {
			this.error('Unable to summarize parsedHtml', e);
			throw Error('Unable to summarize parsedHtml');
		}

		return { success: true, error: null, data: { output: responseText } };
	};
}
