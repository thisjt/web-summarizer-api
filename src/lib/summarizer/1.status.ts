import { ChangeStatus } from './0.constructor';

export const StatusModifier: ChangeStatus = {
	async changeStatus(prisma, id, status, error) {
		let dataUpdate;
		switch (status) {
			case 'failed':
				dataUpdate = { completed: new Date().getTime(), summary_error_message: error?.message || 'Unknown' };
				break;
			case 'completed':
				dataUpdate = { completed: new Date().getTime() };
				break;
			case 'processing':
				dataUpdate = { started: new Date().getTime() };
				break;
			default:
				dataUpdate = {};
				break;
		}

		try {
			await prisma.jobs.update({
				data: {
					status,
					...dataUpdate,
				},
				where: { id },
			});
			return { success: true, error: null, data: { output: 'ok' } };
		} catch {
			return { success: false, error: { code: 1, message: 'Error changing status' }, data: null };
		}
	},
};
