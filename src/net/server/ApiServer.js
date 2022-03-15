const http = require("http");
const Cookies = require("cookies");
const Router = require("./Router");
const JSONHTTPRequest = require("./JSONHTTPRequest");
const JSONHTTPResponse = require("./JSONHTTPResponse");
const config = require("../../../config.json");

class ApiServer {
    constructor() {
        this.instance = http.createServer((req, res) => this.handle(req, res));
        this.router = new Router();
        this.options = config.api;

        this.instance.on('error', err => {
            throw err;
        });
    }

    handle(req, res) {
        const cookies = new Cookies(req, res, {keys: this.options.cookiesKeys});
        const request = new JSONHTTPRequest(req, cookies);
        const response = new JSONHTTPResponse(res, cookies);

        this.router.handle(request.path, request, response);
    }

    listen() {
        return new Promise(resolve => {
            this.instance.listen({port: this.options.port}, () => {
                resolve();
            });
        });
    }

    close() {
        return new Promise(resolve => {
            this.instance.close(() => {
                resolve();
            });
        });
    }
}

module.exports = ApiServer;