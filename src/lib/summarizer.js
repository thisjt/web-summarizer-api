import puppeteer from 'puppeteer';
import prisma from './prisma';
import log from './logging';

const SHORT_PARAGRAPH = 100; //characters
const INFERENCE_API = process.env.INFERENCE_API || 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const HFTOKEN = process.env.HFTOKEN;

export class Summarizer {
	/**
	 * We will not be revalidating this, zod already does it for us
	 * @param {number} id
	 * @param {string} [url]
	 */
	constructor(id, url) {
		this.url = url || '';
		this.id = id;
	}
	url = '';
	logs = '';

	/**@param {(string | number)[]} text */
	logger(...text) {
		log(`${new Date().toLocaleTimeString()}: ${text.join(' ')}`);
		this.logs += `${new Date().toLocaleTimeString()}: ${text.join(' ')}\n`;
	}

	async run() {
		this.logger('Starting job id', this.id);

		await this.pending();

		const scrapeData = await this.scrape();
		if (scrapeData.error || !scrapeData.data) return await this.fail('Failed to scrape web page');

		const clean = this.cleanup(scrapeData.data);
		if (clean.error || !clean.data) return await this.fail('Data is too short to be summarized');

		const summary = await this.summarize(clean.data);
		if (summary.error || !summary.data) return await this.fail('Unable to summarize web page');

		this.save(summary.data);
	}

	async pending() {
		try {
			await prisma.jobs.update({
				data: {
					status: 'processing',
				},
				where: { id: this.id },
			});
		} catch (e) {
			log('Error', e);
		}
	}

	/**@param {string} [url] */
	async scrape(url) {
		url = url || this.url;
		this.logger('Scraping page');

		try {
			this.logger('Opening browser');
			const browser = await puppeteer.launch();
			this.logger('Opening page');
			const page = await browser.newPage();
			this.logger('Going to url');
			await page.goto(url);
			this.logger('Waiting for load to finish');
			await page.waitForFunction('window.performance.timing.loadEventEnd - window.performance.timing.navigationStart >= 500');
			const bodyHandle = await page.$('body');
			this.logger('Grabbing page body');
			const html = await page.evaluate((body) => {
				let pData = '';
				[...(body?.querySelectorAll('p') || [])].forEach((p) => {
					pData += p.textContent + ' ';
				});
				return pData;
			}, bodyHandle);
			const htmlRemovedTags = html.replace(/<\/?[^>]+(>|$)/g, '');
			this.logger('Closing browser');
			await browser.close();
			return { error: false, data: htmlRemovedTags };
		} catch (e) {
			this.logger('Failed to scrape page');
			this.logger(JSON.stringify(e));
			return { error: true };
		}
	}

	/**@param {string} html */
	cleanup(html) {
		const htmlTrimmedSpaces = html
			.split('\n')
			.map((line) => line.replace(/\s+/g, ' ').trim())
			.join('\n');
		const htmlSplitNewLine = htmlTrimmedSpaces.split('\n');
		htmlSplitNewLine.forEach((v, i) => (htmlSplitNewLine[i] = htmlSplitNewLine[i].trim()));
		const htmlFilterShortStrings = htmlSplitNewLine.filter((str) => str.length > SHORT_PARAGRAPH);
		const htmlParagraph = htmlFilterShortStrings.join(' ');
		if (htmlParagraph.length > SHORT_PARAGRAPH) return { error: false, data: htmlParagraph };
		else return { error: true };
	}

	/**@param {string} paragraph */
	async summarize(paragraph) {
		// I had issues with being rate limited due to pushing too much data to HF
		const truncatedParagraph = paragraph.slice(0, 5000);

		try {
			this.logger('Calling HF API for summarization');
			const response = await fetch(INFERENCE_API, {
				headers: {
					Authorization: `Bearer ${HFTOKEN}`,
					'Content-Type': 'application/json',
				},
				method: 'POST',
				body: JSON.stringify({
					inputs: truncatedParagraph,
				}),
			});
			/**@type {{summary_text:string | null}[] | null} */
			const data = await response.json();

			if (data?.[0]?.summary_text) {
				return { error: false, data: data[0].summary_text, truncatedParagraph };
			} else {
				this.logger('Unable to grab summary_text');
				this.logger(JSON.stringify(data));
				// log(truncatedParagraph);
				return { error: true };
			}
		} catch (e) {
			this.logger('Failed to summarize paragraph');
			this.logger(JSON.stringify(e));
			return { error: true };
		}
	}

	/**@param {string} summary */
	async save(summary) {
		try {
			this.logger('Saving to db');
			const result = await prisma.jobs.update({
				data: {
					status: 'completed',
					summary,
					summary_logs: this.logs,
					finished: new Date().getTime(),
				},
				where: {
					id: this.id,
				},
				select: {
					id: true,
					url: true,
					status: true,
					summary: true,
					summary_error_message: true,
					timestamp: true,
				},
			});

			return { error: false, data: { ...result, timestamp: Number(result.timestamp) } };
		} catch (e) {
			this.logger('Failed to save summary to db');
			this.logger(JSON.stringify(e));
			return { error: true };
		}
	}

	/**
	 * @param {string} errmessage
	 * @param {string} [lastline]
	 */
	async fail(errmessage, lastline) {
		try {
			if (lastline) this.logger(lastline);

			await prisma.jobs.update({
				data: {
					status: 'failed',
					summary_logs: this.logs,
					summary_error_message: errmessage,
					finished: new Date().getTime(),
				},
				where: {
					id: this.id,
				},
			});
		} catch (e) {
			log('Error', e);
		}
	}
}
