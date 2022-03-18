const DatabaseHandler = require("./db/DatabaseHandler");
const UserManager = require("./users/UserManager");
const ApiServer = require("./net/server/ApiServer");

class Application {
	constructor() {
		this.db = new DatabaseHandler();
		this.apiServer = new ApiServer();
		this.users = new UserManager({router: this.apiServer.router});
	}

	async start() {
		await this.db.connect();
		await this.users.init({database: this.db});
		await this.apiServer.listen();
	}

	async stop() {
		await this.apiServer.close();
		await this.db.close();
	}
}

module.exports = Application;