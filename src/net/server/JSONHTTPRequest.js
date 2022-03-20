const {URL} = require("url");

class JSONHTTPRequest {
    constructor(incomingMessage, cookies) {
        this.incomingMessage = incomingMessage;
        this.cookies = cookies;
        this.method = incomingMessage.method;
        this.url = new URL(this.incomingMessage.url, `http://${this.incomingMessage.headers.host}`);

        this.dataObject = undefined;
    }

    get data() {
        return new Promise((resolve, reject) => {
            if(this.dataObject !== undefined) {
                resolve(this.dataObject);
            }

            let data = "";

            this.incomingMessage.on("data", chunk => {
                if(chunk === undefined || chunk.toString() === undefined) return;

                data += chunk.toString();
            });

            this.incomingMessage.on("end", () => {
                try {
                    this.dataObject = JSON.parse(data);
                    resolve(this.dataObject);
                }
                catch(e) {
                    reject(e);
                }
            })
        });
    }

    header(name) {
        return this.incomingMessage.headers[name];
    }

    get path() {
        return this.url.pathname;
    }
}

module.exports = JSONHTTPRequest;