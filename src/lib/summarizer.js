export class Summarizer {
	/**
	 * We will not be revalidating this, zod already does it for us
	 * @param {number} id
	 * @param {string} url
	 */
	constructor(id, url) {
		this.url = url;
		this.id = id;
	}
	url = '';
	logs = '';
	/**@param {(string | number)[]} text */
	logger(...text) {
		this.logs += `${text.join(' ')}\n`;
	}

	async run() {
		this.logger('Starting job id', this.id);
		await this.scrape();
	}

	async scrape() {}
	async cleanup() {}
	async summarize() {}
	async save() {}
}
