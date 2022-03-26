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

	async create({keys, team}) {
		const id = nanoid(16);
		const scores = {};
		keys.forEach(key => scores[key] = 0);
		const proof = new ProofModel({id, scores, images: [], team});

		await this.collection.insertOne(proof.toDocument());

		return proof;
	}

	async getTeam(id) {
		return (await this.get({id})).team;
	}

	async addImage(id, image) {
		const proof = await this.get({id});

		if(proof === undefined) return;

		proof.images.push(image);

		await this.collection.replaceOne({id}, proof);
	}

	async setScores(id, scores) {
		const proof = await this.getModel({id});

		if(proof === undefined) return false;

		for(const key of Object.keys(proof.scores)) {
			if(typeof scores[key] !== "number") return false;

			proof.scores[key] = scores[key];
		}

		await this.collection.replaceOne({id}, proof.toDocument());

		return true;
	}

	get(data) {
		return this.collection.findOne(data);
	}

	async getModel(data) {
		return new ProofModel(await this.get(data));
	}
}

module.exports = ProofManager;