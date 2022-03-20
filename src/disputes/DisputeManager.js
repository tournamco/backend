const { nanoid } = require("nanoid");
const DisputeApi = require("./DisputeApi");

class DisputeManager {
	constructor({router, tournaments, proofs, matches}) {
		new DisputeApi(router, tournaments, proofs, matches, this);
	}

	init({database}) {
		this.collection = database.collection("disputes");
	}

	async create({match, game, tournament}) {
		const id = nanoid(16);

		await this.collection.insertOne({id, match, game, tournament, createdAt: new Date().getTime()});

		return id;
	}

	get(data) {
		return this.collection.findOne(data);
	}
}

module.exports = DisputeManager;