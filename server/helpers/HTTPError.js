import http from 'http';

export default class HTTPError extends Error {
	constructor(code, message) {
		let publicMessage = message || http.STATUS_CODES[code];
		super(publicMessage);
		Error.captureStackTrace(this, HTTPError);
		this.HTTPcode = code;
		this.publicMessage = publicMessage;
	}
}