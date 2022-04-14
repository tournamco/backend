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

	async create({name, startDate, endDate, keys, newKeys, tournament}, numberOfGames) {
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
		
		const match = new MatchModel({id, name, startDate, endDate, keys, newKeys, games, finished, teams, tournament});

		await this.collection.insertOne(match.toDocument());

		return match;
	}

	updateDate(id, startDate, endDate) {
		return this.collection.updateOne({id}, {$set: {startDate: startDate.valueOf(), endDate: endDate.valueOf()}});
	}

	async addGameProof(id, gameIndex, key, proof) {
		const match = await this.getModel({id});

		if(match == undefined) return false;

		const game = match.getGame(gameIndex);

		if(game == undefined) return false;

		game.proofs[key] = proof;

		await this.collection.replaceOne({id}, match);

		return true;
	}

	async setResignLoser(id, loser, teams) {
		const match = await this.getModel({id});

		if(match == undefined) return;
		
		for(const key of match.keys) {
			match.finished[key] = true;
			match.teams[key] = (await teams.get({key})).id;
		}

		for(const game of match.games) {
			for(const key of match.keys) {
				if(key == loser) {
					game.scores[key] = 0;
				}
				else {
					game.scores[key] = 1;
				}
			}
		}

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

	async isFinished(id, key) {
		const match = await this.get({id});

		if(match == null) return;

		return match.finished[key];
	}

	async decide(id) {
		const match = await this.getModel({id});

		for(let i = 0; i < match.games.length; i++) {
			const game = match.games[i];

			if(await game.areScoresUndisputed(this.proofs)) {
				const proofsData = await game.getSetProofs(this.proofs);

				if(proofsData.length == 0) {
					continue;
				}
				
				await this.setGameScores(match.id, i, proofsData[0].scores);
			}
			else {
				await this.disputes.create({match: id, tournament: match.tournament, game: i});
			}
		}
	}

	async setGameScores(id, gameIndex, scores) {
		const match = await this.getModel({id});

		if(match == undefined) return;

		const game = match.getGame(gameIndex);
		game.scores = scores;

		await this.collection.replaceOne({id}, match);
	}

	get(data) {
		return this.collection.findOne(data);
	}

	getAll(data) {
		return this.collection.find(data).toArray();
	}

	async getModel(data) {
		const contents = await this.get(data);

		if(contents == undefined) return;

        return new MatchModel(contents);
    }

	delete(data) {
		return this.collection.deleteMany(data);
	}

	async getArrayByIds(array) {
		const list = await (await this.collection.find({id:{$in:array}})).toArray();
		const matches = [];

		for(const item of list) {
			matches.push(new MatchModel(item));
		}

		return matches;
	}
}

module.exports = MatchManager;