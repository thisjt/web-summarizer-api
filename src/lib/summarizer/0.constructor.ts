import type { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { Bindings } from '../types';

type PrismaModels = {
	[M in Prisma.ModelName]: Exclude<Awaited<ReturnType<PrismaClient[Uncapitalize<M>]['findUnique']>>, null>;
};

type ReturnStructureNoData<T> = { success: true; error: null; data: T } | { success: false; error: { message: string; code: number }; data: null };
export type ReturnStructure = ReturnStructureNoData<{ output: string }>;

export type Status = 'queue' | 'processing' | 'completed' | 'failed';

export interface JobRU {
	// no C(reate), D(elete)
	readJob({ id }: { id?: number }): Promise<ReturnStructureNoData<Partial<PrismaModels['Jobs']> | null>>;
	updateJob({ id, data }: { id?: number; data: Partial<PrismaModels['Jobs'] | null> }): Promise<ReturnStructureNoData<Partial<PrismaModels['Jobs']> | null>>;
}

export interface ChangeStatus {
	changeStatus(status: Status, error?: ReturnStructure['error']): Promise<ReturnStructure>;
}

export interface SumFetcher {
	fetch(url?: string): Promise<ReturnStructure>;
}

export interface SumParser {
	parse(rawHtml?: string): Promise<ReturnStructure>;
}

export interface SumSummarize {
	summarize(parsedHtml?: string): Promise<ReturnStructure>;
}

export class Logger {
	/**
	 * Using In House console.log. Extend this class then use this.setLogger() to reinject this dependency
	 * @param messages
	 */
	log = (...messages: unknown[]): void => {
		console.log(...messages);
	};
	/**
	 * Using In House console.error. Extend this class then use this.setLogger() to reinject this dependency
	 * @param messages
	 */
	error = (...messages: unknown[]): void => {
		console.log(...messages);
	};
	/**
	 * Using In House console.debug. Extend this class then use this.setLogger() to reinject this dependency
	 * @param messages
	 */
	debug? = (...messages: unknown[]): void => {
		console.debug(...messages);
	};
}

export class Summarizer extends Logger {
	id: number = 0;
	url: string = '';
	rawHtml: string = '';
	parsedHtml: string = '';
	summary: string = '';
	status: Status = 'queue';

	sumFetcher: SumFetcher | null = null;
	sumParser: SumParser | null = null;
	sumSummarize: SumSummarize | null = null;
	sumStatus: ChangeStatus | null = null;

	sumJobRU: JobRU | null = null;
	bindings: Bindings | null = null;
	options: { url?: string; bindings?: Bindings; id?: number } | null = null;

	constructor(params: { url?: string; bindings?: Bindings; id?: number }) {
		super();
		const { url, bindings, id } = params;
		if (url) this.url = url;
		if (bindings) this.bindings = bindings;
		if (id) this.id = id;

		this.options = { url, bindings, id };
	}

	setUrl(url: string) {
		if ((typeof url === 'string' ? url : '').length) this.url = url;
	}

	setLogger(logger: Logger) {
		this.log = logger.log;
		this.error = logger.error;
		if (logger.debug) this.debug = logger.debug;
	}

	setStatusChanger(sumStatus: ChangeStatus) {
		this.sumStatus = sumStatus;
	}

	setJobRU(sumJobRU: JobRU) {
		this.sumJobRU = sumJobRU;
	}
	readJob: JobRU['readJob'] = async ({ id } = { id: this.id }) => {
		if (!this.sumJobRU) {
			this.error('No status changer specified');
			throw Error('No status changer specified');
		}
		const job = await this.sumJobRU.readJob({ id });
		if (job.success && job.data) {
			this.id = job.data.id || this.id;
			this.url = job.data.url || this.url;
			this.status = (job.data.status as Status) || this.status;
		}
		return job;
	};
	updateJob: JobRU['updateJob'] = async ({ id, data } = { id: this.id, data: null }) => {
		if (!this.sumJobRU) {
			this.error('No status changer specified');
			throw Error('No status changer specified');
		}
		return await this.sumJobRU.updateJob({ id, data });
	};

	/**
	 * Changes the status of the job being processed. Returns
	 * a promise which can be parallelled with the summarizing (Promise.all)
	 * @param {'queue' | 'processing' | 'completed' | 'failed'} status
	 * @returns {Promise<ReturnStructure>}
	 */
	async setStatus(status: Status, error?: ReturnStructure['error']): Promise<ReturnStructure> {
		if (!this.sumStatus) {
			this.error('No status changer specified');
			throw Error('No status changer specified');
		}
		const result = await this.sumStatus.changeStatus(status, error);
		if (result.success) {
			this.status = status;
			return result;
		} else {
			this.error(result.error);
			this.error('Unable to change status from', this.status, 'to', status, 'for id', this.id, 'and url', this.url);
			throw Error('Unable to change status');
		}
	}

	setFetcher(sumFetcher: SumFetcher) {
		this.sumFetcher = sumFetcher;
	}

	/**
	 * Fetches the url specified and returns the raw HTML data
	 * @param url
	 * @returns {Promise<ReturnStructure>}
	 */
	async fetch(url?: string): Promise<ReturnStructure> {
		if (this.rawHtml) return { success: true, error: null, data: { output: this.rawHtml } };
		if (!this.sumFetcher) {
			this.error('No fetcher specified');
			throw Error('No fetcher specified');
		}
		const result = await this.sumFetcher.fetch(url || this.url);
		if (result.success) {
			this.rawHtml = result.data.output;
			return result;
		} else {
			this.error('Failed to fetch url', this.url);
			throw Error('Failed to fetch url ' + this.url);
		}
	}

	setParser(sumParser: SumParser) {
		this.sumParser = sumParser;
	}

	/**
	 * Parses the raw HTML string to a properly processed paragraph/string
	 * @param rawHtml
	 * @returns {Promise<ReturnStructure>}
	 */
	async parse(rawHtml?: string): Promise<ReturnStructure> {
		if (this.parsedHtml) return { success: true, error: null, data: { output: this.parsedHtml } };
		if (!this.sumParser) {
			this.error('No parser specified');
			throw Error('No parser specified');
		}
		const result = await this.sumParser.parse(rawHtml || this.rawHtml);
		if (result.success) {
			this.parsedHtml = result.data.output;
			return result;
		} else {
			this.error('Failed to fetch url', this.url);
			throw Error('Failed to fetch url ' + this.url);
		}
	}

	setSummarize(sumSummarize: SumSummarize) {
		this.sumSummarize = sumSummarize;
	}

	/**
	 * Summarizes the properly processed paragraph/string to a summary using an LLM
	 * @param parsedHtml
	 * @returns {Promise<ReturnStructure>}
	 */
	async summarize(parsedHtml?: string): Promise<ReturnStructure> {
		if (this.summary) return { success: true, error: null, data: { output: this.summary } };
		if (!this.sumSummarize) {
			this.error('No summarizer specified');
			throw Error('No summarizer specified');
		}

		const result = await this.sumSummarize.summarize(parsedHtml || this.parsedHtml);
		if (result.success) {
			this.summary = result.data.output;
			return result;
		} else {
			this.error('Failed to summarize url', this.url);
			throw Error('Failed to summarize url ' + this.url);
		}
	}

	async failStep<T>(
		error: { message: string; code: number },
		consoleErrorParams: unknown[],
		promisesToWait: Promise<unknown>[],
		callback: (error: { message: string; code: number }) => Promise<T>,
	): Promise<T> {
		this.error(error.message, error.code, ...consoleErrorParams);
		await Promise.all(promisesToWait);
		this.setStatus('failed', error);
		return await callback(error);
	}
}
