import prisma from '../prisma';
import { Summarizer, type JobRU } from './0.constructor';

const dbselect = {
	id: true,
	url: true,
	status: true,
	summary: true,
	summary_logs: true,
	summary_error_message: true,
	timestamp: true,
	started: true,
	finished: true,
};
export class JobReadUpdateDependency extends Summarizer {
	readJob: JobRU['readJob'] = async ({ id }) => {
		if (!this.bindings) {
			this.error('No bindings specified', this.bindings);
			throw Error('No bindings specified');
		}

		id = id || this.id;

		let result;
		try {
			if (id) {
				result = await prisma(this.bindings.DB).jobs.findFirst({
					select: dbselect,
					where: { id },
				});
			} else {
				result = await prisma(this.bindings.DB).jobs.findFirst({
					select: dbselect,
					where: { status: 'queue' },
				});
			}
		} catch (e) {
			this.error('Error readJob query', e);
			return { success: false, error: { code: 2, message: 'Error readJob query' }, data: null };
		}
		if (result) this.id = result.id;
		return { success: true, error: null, data: result };
	};
	updateJob: JobRU['updateJob'] = async ({ id, data } = { id: this.id, data: null }) => {
		if (!this.bindings) {
			this.error('No bindings specified', this.bindings);
			throw Error('No bindings specified');
		}
		if (!data) {
			this.error('No data provided', data);
			throw Error('No data provided');
		}
		if (!id) id = this.id;

		let result;
		try {
			result = await prisma(this.bindings.DB).jobs.update({
				data,
				select: dbselect,
				where: { id },
			});
		} catch (e) {
			this.error('Error updateJob query', e);
			return { success: false, error: { code: 2, message: 'Error updateJob query' }, data: null };
		}
		return { success: true, error: null, data: result || null };
	};
}
