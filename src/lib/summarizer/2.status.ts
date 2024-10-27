import prisma from '../prisma';
import { type ChangeStatus, Summarizer } from './0.constructor';

export class ChangeStatusDependency extends Summarizer {
	changeStatus: ChangeStatus['changeStatus'] = async (status, error) => {
		const [bindings, id] = [this.bindings, this.id];
		let dataUpdate;
		switch (status) {
			case 'failed':
				dataUpdate = { finished: new Date().getTime(), summary_error_message: error?.message || 'Unknown' };
				break;
			case 'completed':
				dataUpdate = { finished: new Date().getTime() };
				break;
			case 'processing':
				dataUpdate = { started: new Date().getTime() };
				break;
			default:
				dataUpdate = {};
				break;
		}

		try {
			if (!bindings) throw Error('No bindings found');
			console.log('XXXXXXXXXX', status, dataUpdate, id);
			await prisma(bindings.DB).jobs.update({
				data: {
					status,
					...dataUpdate,
				},
				where: { id },
				select: {
					id: true,
					status: true,
				},
			});
			return { success: true, error: null, data: { output: status } };
		} catch (e) {
			this.error('Error changing status', e);
			return { success: false, error: { code: 1, message: 'Error changing status' }, data: null };
		}
	};
}
