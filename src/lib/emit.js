const LOGLEVEL = 'debug';

/**
 * @typedef {import('zod').SafeParseError<any>} SafeParseError
 *
 * @param {object} data
 * @param {SafeParseError | Object<string, string[]>} [data.errors]
 * @param {number} [data.id]
 * @param {string} [data.url]
 * @param {"queue" | "processing" | "completed" | "failed" | string} [data.status]
 * @param {*} [data.debug]
 */
export default function emit(data) {
	if (LOGLEVEL !== 'debug') delete data.debug;

	if (data.errors) {
		if (!Array.isArray(data.errors.error)) {
			return { success: false, errors: data.errors.error.flatten().fieldErrors };
		} else {
			return { success: false, errors: data.errors };
		}
	} else return { ...data, success: true };
}
