const mongo = require('mongodb');
const config = require("../../config.json");

/**
 * This class manager the connection with database.
 * @class DatabaseHandler
 */
class DatabaseHandler {
	constructor() {
		this.config = config.database;
		this.client = new mongo.MongoClient(this.config.url);

		this.dbName = this.config.database;
	}

	/**
	 * Connect to database.
	 * @returns {Promise<void>} Returns a promise that resolves when the connection is established.
	 */
	async connect() {
		this.client.on("error", e => console.error(e));
		await this.client.connect().catch(e=>{throw e});
		this.db = this.client.db(this.dbName);
	}

	/**
	 * Close the connection with database.
	 * @returns {Promise<void>} Returns a promise that resolves when the connection is closed.
	 */
	close() {
		return this.client.close();
	}

	/**
	 * Returns a collection in the database.
	 * @param {String} name The name of the collection. 
	 * @returns {mongo.Collection} Returns the collection.
	 */
	collection(name) {
		return this.db.collection(name);
	}
}

module.exports = DatabaseHandler;