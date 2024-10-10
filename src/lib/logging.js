const LOGLEVEL = process.env.LOGLEVEL;

/**@param {*} data */
export default function log(...data) {
	if (LOGLEVEL === 'debug') console.log(`${new Date().toLocaleTimeString()}: ${data.join(' ')}`);
}
