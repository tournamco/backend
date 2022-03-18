const { MongoClient } = require('mongodb');
const config = require("../../config.json");

class DatabaseHandler {
	constructor() {
		this.config = config.database;
		this.client = new MongoClient(this.config.url);

		this.dbName = this.config.database;
	}

	async connect() {
		this.client.on("error", e => console.error(e));
		await this.client.connect().catch(e=>{throw e});
		this.db = this.client.db(this.dbName);
	}

	close() {
		return this.client.close();
	}

	collection(name) {
		return this.db.collection(name);
	}
}

module.exports = DatabaseHandler;