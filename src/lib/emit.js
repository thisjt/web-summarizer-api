const LOGLEVEL = 'debug';

/**
 * @typedef {import('zod').SafeParseError<any>} SafeParseError
 *
 * @param {object} data
 * @param {Object<string, string[]>} [data.errors]
 * @param {SafeParseError} [data.zodErrors]
 * @param {number} [data.id]
 * @param {string} [data.url]
 * @param {"queue" | "processing" | "completed" | "failed" | string} [data.status]
 * @param {*} [data.debug]
 */
export default function emit(data) {
	if (LOGLEVEL !== 'debug') delete data.debug;

	if (data.errors) {
		return { success: false, errors: data.errors };
	} else if (data.zodErrors) {
		return { success: false, errors: data.zodErrors.error.flatten().fieldErrors };
	} else {
		return { ...data, success: true };
	}
}
