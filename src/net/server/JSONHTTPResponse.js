class JSONHTTPResponse {
    constructor(serverResponse, cookies) {
        this.serverResponse = serverResponse;
        this.cookies = cookies;
    }

    send(data = {}, code = 200) {
        this.serverResponse.statusCode = data.errno !== undefined ? data.code : code;
        this.serverResponse.end(JSON.stringify(data));
    }
}

module.exports = JSONHTTPResponse;