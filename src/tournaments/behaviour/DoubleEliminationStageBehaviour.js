const {nanoid} = require("nanoid");
const RoundModel = require("../RoundModel");
const AbstractStageBehaviour = require("./AbstractStageBehaviour");

class DoubleEliminationStageBehaviour extends AbstractStageBehaviour {
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

	get matchLength() {};

	async generateRounds(matchManager) {
		let rounds = [];
		let upperRemainder = [];
		let lowerRemainder = [];
		let i = 0;

		for(let j = 0; j < this.stage.numberOfParticipants; j++) {
			const id = nanoid(8);
			this.stage.freeKeys.push(id);
			upperRemainder.push(id);
		}

		while(lowerRemainder.length > 1 && i < this.stage.options.numberOfRounds) {
			const round = new RoundModel({id: nanoid(16), name: `Round ${i+1}`, matches: []}, this.stage);
			let newUpperRemainder = [];
			let newLowerRemainder = [];

			for(let j = 0; j < upperRemainder.length && upperRemainder.length > 1; j+=2) {
				if(j == upperRemainder.length-1) {
					newUpperRemainder.push(upperRemainder[j]);

					continue;
				}

				const winnerKey = nanoid(8);
				const loserKey = nanoid(8);
				newUpperRemainder.push(winnerKey);
				newLowerRemainder.push(loserKey);

				const match = await matchManager.create({name: `Match U${j+1}`, keys: [upperRemainder[j], upperRemainder[j+1]], tournament: this.stage.tournament.id, newkeys: [winnerKey, loserKey]}, this.stage.options.bestOf);
				round.addMatch(match);
			}

			for(let j = 0; j < lowerRemainder.length && upperRemainder > 0; j+=2) {
				if(j == lowerRemainder.length-1) {
					newLowerRemainder.push(lowerRemainder[j]);

					continue;
				}

				const winnerKey = nanoid(8);
				newLowerRemainder.push(winnerKey);

				const match = await matchManager.create({name: `Match L${j+1}`, keys: [lowerRemainder[j], lowerRemainder[j+1]], tournament: this.stage.tournament.id, newkeys: [winnerKey, undefined]}, this.stage.options.bestOf);
				round.addMatch(match);
			}

			upperRemainder = newUpperRemainder;
			lowerRemainder = newLowerRemainder;

			rounds.push(round);
			i++;
		}

		if(i < this.stage.options.numberOfRounds) {
			const round = new RoundModel({id: nanoid(16), name: `Round ${i+1}`, matches: []}, this.stage);
			const match = await matchManager.create({name: `Match F1`, keys: [upperRemainder[0], lowerRemainder[0]], tournament: this.stage.tournament.id}, this.stage.options.bestOf);
			round.addMatch(match);
			rounds.push(round);
		}

		return rounds;
	};

	isValid() {
        if(this.stage.options.bestOf <= 0) return false;
        if(this.stage.options.numberOfRounds <= 0) return false;

		return true;
	};
}

module.exports = DoubleEliminationStageBehaviour;