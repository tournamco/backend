const { MongoClient } = require('mongodb');
const config = require("../../config.json");

class DatabaseHandler {
	constructor() {
		this.config = config.database;
		this.client = new MongoClient({
			url: this.config.url
		});

		this.dbName = this.config.database;
	}

	async connect() {
		await this.client.connect();
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