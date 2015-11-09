export default class HTTPError extends Error {
    constructor(statusCode, message) {
        super();

        this.statusCode = statusCode;
        this.message = message;
    }
}
