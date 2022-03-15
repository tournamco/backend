const MatchModel = require("./MatchModel");

class MatchManager {
	constructor({database}) {
		this.collection = database.collection("matches");
	}

	/**
	 * @param {String} name 
	 * @param {String} type 
	 * @param {Date} datetime
	 */
	create(name, type, datetime) {
		const match = new MatchModel({name, type, datetime});

		this.collection.insertOne(match.toDocument());
	}
}