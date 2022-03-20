const { nanoid } = require("nanoid");
const MatchModel = require("./MatchModel");
const MatchScheduler = require("./MatchScheduler");

class MatchManager {
	init({database, proofs, disputes}) {
		this.collection = database.collection("matches");
		this.scheduler = new MatchScheduler();
		this.proofs = proofs;
		this.disputes = disputes;
	}

	async create({name, startDate, endDate, keys, newKeys}, numberOfGames) {
		const id = nanoid(16);
		const games = Array(numberOfGames).fill(1).map(() => {
			const stage = {};
			stage.scores = {};
			stage.proofs = {};
			keys.forEach(key => {
				stage.scores[key] = undefined;
				stage.proofs[key] = undefined;
			});

			return stage;
		});
		const teams = {};
		const finished = {};
		keys.forEach(key => {
			teams[key] = undefined;
			finished[key] = false;
		});
		const match = new MatchModel({id, name, startDate, endDate, keys, newKeys, games, finished, teams});

		await this.collection.insertOne(match.toDocument());

		return match;
	}

	updateDate(id, startDate, endDate) {
		return this.collection.updateOne({id}, {$set: {startDate: startDate.valueOf(), endDate: endDate.valueOf()}});
	}

	async addGameProof(id, game, key, proof) {
		const match = await this.get({id});

		if(match == null) return;

		match.getGame(game).proofs[key] = proof;

		await this.collection.replaceOne({id}, match);
	}

	async setFinished(id, key, team) {
		const match = await this.get({id});

		if(match == null) return;

		match.finished[key] = true;
		match.teams[key] = team;

		await this.collection.replaceOne({id}, match);

		return match;
	}

	async decide(id, tournament) {
		const match = await this.getModel({id});

		for(let i = 0; i < match.games.length; i++) {
			const game = match.games[i];

			if(game.areScoresUndisputed(this.proofs))  {
				await this.setGameScores(match.id, i, game(await game.getSetProofs(this.proofs))[0]);
			}
			else {
				// TODO: Create dispute
			}
		}
	}

	setGameScores

	get(data) {
		return this.collection.findOne(data);
	}

	async getModel(data) {
        return new MatchModel(await this.get(data));
    }
}

module.exports = MatchManager;