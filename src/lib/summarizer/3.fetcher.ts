import { type SumFetcher, Summarizer } from './0.constructor';
import puppeteer from '@cloudflare/puppeteer';

export class BrowserRendererDependency extends Summarizer {
	fetch: SumFetcher['fetch'] = async (url) => {
		if (!this.bindings) {
			this.error('No bindings specified', this.bindings);
			throw Error('No bindings specified');
		}

		let htmlString = '';
		if (!url) url = this.url;
		try {
			const browser = await puppeteer.launch(this.bindings.BROWSER);
			const page = await browser.newPage();
			await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15');
			await page.goto(url, { waitUntil: 'load', timeout: 15000 });
			htmlString = await page.content();
			await browser.close();
		} catch (e) {
			this.error('Unable to puppeteer url', e);
			throw Error('Unable to puppeteer url');
		}

		return { success: true, error: null, data: { output: htmlString } };
	};
}
