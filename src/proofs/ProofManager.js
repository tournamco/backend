const { nanoid } = require("nanoid");
const ProofApi = require("./ProofApi");
const ProofModel = require("./ProofModel");

class ProofManager {
	constructor({router, matches, users, teams}) {
		new ProofApi(router, matches, users, teams, this);
	}

	init({database}) {
		this.collection = database.collection("proofs");
	}

	async create({keys}) {
		const id = nanoid(16);
		const scores = {};
		keys.forEach(key => scores[key] = 0);
		const proof = new ProofModel({id, scores, images: []});

		await this.collection.insertOne(proof.toDocument());

		return proof;
	}

	async addImage(id, image) {
		const proof = await this.get({id});

		if(proof === undefined) return;

		proof.images.push(image);

		await this.collection.replaceOne({id}, proof);
	}

	get(data) {
		return this.collection.findOne(data);
	}

	getModel(data) {
		return new ProofModel(await this.get(data));
	}
}

module.exports = ProofManager;