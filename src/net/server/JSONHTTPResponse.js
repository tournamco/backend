class JSONHTTPResponse {
    constructor(serverResponse, cookies) {
        this.serverResponse = serverResponse;
        this.cookies = cookies;
    }

    send(data = {}, code = 200) {
        this.setContentType("application/json");
        this.serverResponse.statusCode = data.errno !== undefined ? data.code : code;
        this.serverResponse.end(JSON.stringify(data));
    }

    setContentType(type) {
        this.serverResponse.setHeader("Content-Type", type);
    }
}

module.exports = JSONHTTPResponse;