import { type SumParser, Summarizer } from './0.constructor';
import * as cheerio from 'cheerio';

export class ParserDependency extends Summarizer {
	parse: SumParser['parse'] = async (rawHtml) => {
		if (!this.bindings) {
			this.error('No bindings specified', this.bindings);
			throw Error('No bindings specified');
		}

		/**
		 * Grabbing text inside the <p> tags are better than trying to filter out
		 * unwanted elements. This is a design choice, but it can be better. We do lose
		 * a bit of potentially useful data for summarization though.
		 */
		const htmlString = rawHtml || this.rawHtml;
		const $ = cheerio.load(htmlString);
		const pTags = $('p');
		const parsedHtml = pTags.text();

		return { success: true, error: null, data: { output: parsedHtml } };
	};
}
