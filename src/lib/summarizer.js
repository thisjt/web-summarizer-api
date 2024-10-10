export class Summarizer {
	/**
	 * We will not be revalidating this, zod already does it for us
	 * @param {string} url
	 */
	constructor(url) {
		this.url = url;

		this.init();
	}

	async init() {
		await this.scrape();
	}

	async scrape() {}
	async cleanup() {}
	async summarize() {}
	async save() {}
}
