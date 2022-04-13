const {nanoid} = require("nanoid");
const RoundModel = require("../RoundModel");
const AbstractStageBehaviour = require("./AbstractStageBehaviour");

class SingleEliminationStageBehaviour extends AbstractStageBehaviour {
	constructor(stage) {
		super(stage);
	}

	getWinnersFromMatches(matchManager, teamManager) {
		const lastRound = this.stage.rounds[this.stage.rounds.length-1];
		const winners = [];

		for(const matchId of lastRound.matches) {
			const match = matchManager.getModel({id: matchId});
			const winnerKey = match.getWinner();
			const winner = match.teams[winnerKey];
			winners.push(winner);
		}

		return winners;
	};

	getMatchLength(match) {
		return match.games * this.stage.tournament.gameLength;
	};

	get defaultMatchLength() {
		return this.stage.options.bestOf * this.stage.tournament.gameLength;
	}

	async generateRounds(matchManager) {
		let rounds = [];
		let remainder = [];
		let i = 0;

		for(let j = 0; j < this.stage.numberOfParticipants; j++) {
			const id = nanoid(8);
			this.stage.freeKeys.push(id);
			remainder.push(id);
		}

		while(remainder.length > 1 && i < this.stage.options.numberOfRounds) {
			const round = new RoundModel({id: nanoid(16), name: `Round ${i+1}`, matches: []}, this.stage);
			let newRemainder = [];

			for(let j = 0; j < remainder.length; j+=2) {
				if(j == remainder.length-1) {
					newRemainder.push(remainder[j]);

					continue;
				}

				const winnerKey = nanoid(8);
				newRemainder.push(winnerKey);

				const match = await matchManager.create({name: `Match ${j/2+1}`, keys: [remainder[j], remainder[j+1]], tournament: this.stage.tournament.id, newkeys: [winnerKey, undefined]}, this.stage.options.bestOf);

				round.addMatch(match);
			}

			remainder = newRemainder;

			rounds.push(round);
			i++;
		}

		return rounds;
	};

	isValid() {
        if(this.stage.options.numberOfRounds <= 0) return false;
        if(this.stage.options.bestOf <= 0) return false;

		return true;
	};
}

module.exports = SingleEliminationStageBehaviour;