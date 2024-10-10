import puppeteer from 'puppeteer';
import prisma from './prisma';

const SHORT_PARAGRAPH = 100; //characters
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
		this.logs += `${new Date().toLocaleTimeString()}: ${text.join(' ')}\n`;
	}

	async run() {
		this.logger('Starting job id', this.id);
		const scrapeData = await this.scrape();
		if (scrapeData.error || !scrapeData.data) return await this.fail();

		const clean = this.cleanup(scrapeData.data);
		return clean;
	}

	/**@param {string} [url] */
	async scrape(url) {
		url = url || this.url;

		try {
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.goto(url);
			await page.waitForFunction('window.performance.timing.loadEventEnd - window.performance.timing.navigationStart >= 500');
			const bodyHandle = await page.$('body');
			const html = await page.evaluate((body) => body?.textContent, bodyHandle);
			await browser.close();
			return { error: false, data: html };
		} catch (e) {
			this.logger('Failed to scrape page.');
			this.logger(JSON.stringify(e));
			return { error: true };
		}
	}

	/**@param {string} html */
	async cleanup(html) {
		const htmlTrimmedSpaces = html
			.split('\n')
			.map((line) => line.replace(/\s+/g, ' ').trim())
			.join('\n');
		const htmlSplitNewLine = htmlTrimmedSpaces.split('\n\n\n');
		htmlSplitNewLine.forEach((v, i) => (htmlSplitNewLine[i] = htmlSplitNewLine[i].trim()));
		const htmlFilterShortStrings = htmlSplitNewLine.filter((str) => str.length > SHORT_PARAGRAPH);
		return htmlFilterShortStrings.join(' ');
	}

	async summarize() {}
	async save() {}

	/**@param {string} [lastline] */
	async fail(lastline) {
		try {
			if (lastline) this.logger(lastline);

			await prisma.jobs.update({
				data: {
					status: 'failed',
					summary_logs: this.logs,
					summary_error_message: '',
					finished: new Date().getTime(),
				},
				where: {
					id: this.id,
				},
			});
		} catch (e) {
			console.log('Error', e);
		}
	}
}
