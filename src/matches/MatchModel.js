const GameModel = require("./GameModel");

class MatchModel {
	constructor({id, name, startDate, endDate, keys, newKeys, games, finished, teams, 
			tournament}) {
		this.id = id;
		this.name = name;
		this.startDate = startDate;
		this.endDate = endDate;
		this.keys = keys;
		this.newKeys = newKeys;
		this.games = games.map(game => new GameModel(game));
		this.finished = finished;
		this.teams = teams;
		this.tournament = tournament;
	}

	get scores() {
		const scores = {};
		this.keys.forEach(key => scores[key] = 0);

		for(const game of this.games) {
			const winners = game.getWinners();

			for(const winner of winners) {
				scores[winner] += 1;
			}
		}

		return scores;
	}

	getWinner() {
		const scores = this.scores;
		let winningKey = this.keys[0];
		let winningScore = 0;

		for(const key of Object.keys(scores)) {
			if(scores[key] <= winningScore) continue;

			winningKey = key;
		}

		return winningKey;
	}

	isDecided() {
		for(const game of this.games) {
			if(!game.isDecided()) return false;
		}

		return true;
	}

	isFinished() {
		for(let key of Object.keys(this.finished)) {
			if(this.finished[key]) continue;

			return false;
		}

		return true;
	}

	getGame(index) {
		return this.games[index];
	}

	async toPublicObject(match, tournament, teamManager, userManager) {
		const teamsData = {};

		for(const key of match.keys) {
			let team;

			if(match.teams != undefined && match.teams[key] != undefined) {
				team = await teamManager.getModel({id: match.teams[key]});
			}
			else {
				team = await teamManager.getModel({key});
			}

			if(team == undefined) continue;

			teamsData[key] = await team.toPublicObject(userManager);
		}

		return {
			id: match.id,
			name: match.name,
			startDate: match.startDate,
			endDate: match.endDate,
			tournament: {
				id: tournament.id,
				name: tournament.name,
				color: tournament.color
			},
			scores: match.scores,
			teams: teamsData,
			keys: match.keys,
			finished: this.finished,
			games: this.games.map(game => game.toPublicObject())
		}
	}

	toDocument() {
		return {
			id: this.id,
			name: this.name,
			startDate: this.startDate,
			endDate: this.endDate,
			keys: this.keys,
			newKeys: this.newKeys,
			games: this.games.map(game => game.toDocument()),
			finished: this.finished,
			teams: this.teams,
			tournament: this.tournament
		};
	}
}

module.exports = MatchModel;