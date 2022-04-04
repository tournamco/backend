const AbstractStageBehaviour = require("./AbstractStageBehaviour");

class SwissEliminationStageBehaviour extends AbstractStageBehaviour {
	constructor(stage) {
		super(stage);
	}

	getWinnersFromMatches(matchManager, teamManager) {
		const wins = [];

        for(const round of this.stage.rounds) {
            for(const matchId of round.matches) {
                const match = matchManager.getModel({id: matchId});
                const winnerKey = match.getWinner();
                const winner = match.teams[winnerKey];

				if(wins[winner] === undefined) wins[winner] = 0;

                wins[winner]++;
            }
        }

		return Object.entries(wins).reduce((acc, [key, value]) => {
			if(value >= this.stage.options.numberOfWins) {
				acc.push(key);
			}
		}).map(key => teamManager.getModel({id: key}));
	};

	getMatchLength(match) {
		return this.stage.tournament.gameLength * match.games;
	};

	get defaultMatchLength() {
		return this.stage.options.bestOf * this.stage.tournament.gameLength;
	}

	generateRounds(matchManager) {
		let rounds = [];
		let wins = [];
		let k = 0;
		const numberOfRounds = this.stage.options.numberOfWins * 2 - 1;

		wins[0] = Array.fill(Math.pow(2, this.stage.numberOfWins + 1)).map(() => nanoid(8));

		for(let i = 0; i < this.stage.options.numberOfWins; i++) {
			const round = new RoundModel({id: nanoid(16), name: `Round ${k+1}`, matches: []}, this.stage);
			let newWins = [];

			for(let j = 0; j < wins.length; j++) {
				const winsKeys = wins[j];
				if(newWins[j] === undefined) newWins[j] = [];
				newWins[j+1] = [];

				for(let l = 0; l < winsKeys.length; l+=2) {
					const winnerKey = nanoid(8);
					const loserKey = nanoid(8);
					const match = matchManager.create({name: `Match ${j+1}`, keys: [wins[j][i], wins[j][i+1]], tournament: this.stage.tournament.id, newkeys: [winnerKey, loserKey]}, (k>=(numberOfRounds-this.stage.options.numberOfFinals)) ? this.stage.options.finalsBestOf : this.stage.options.bestOf);
					round.addMatch(match);
					newWins[j+1].push(winnerKey);
					newWins[j].push(loserKey);
				}
			}

			wins = newWins;
			rounds.push(round);
			k++;
		}

		for(let i = 0; i < this.options.stage.numberOfWins-1; i++) {
			const round = new RoundModel({id: nanoid(16), name: `Round ${k+1}`, matches: []}, this.stage);
			let newWins = [];
			newWins[0] = wins[0];
			newWins[wins.length-1] = wins[wins.length-1];

			for(let j = 1; j < wins.length-1; j++) {
				const winsKeys = wins[j];
				if(newWins[j] === undefined) newWins[j] = [];
				newWins[j+1] = [];

				for(let l = 0; l < winsKeys.length; l+=2) {
					const winnerKey = nanoid(8);
					const loserKey = nanoid(8);
					const match = matchManager.create({name: `Match ${j+1}`, keys: [wins[j][i], wins[j][i+1]], tournament: this.stage.tournament.id, newkeys: [winnerKey, loserKey]}, (k>=(numberOfRounds-this.stage.options.numberOfFinals)) ? this.stage.options.finalsBestOf : this.stage.options.bestOf);
					round.addMatch(match);
					newWins[j+1].push(winnerKey);
					newWins[j].push(loserKey);
				}
			}
				
			wins = newWins;
			rounds.push(round);
			k++;
		}

		return rounds;
	};
	isValid() {
		if(this.stage.options.finalsBestOf <= 0) return false;
        if(this.stage.options.numberOfFinals <= 0) return false;
        if(this.stage.options.bestOf <= 0) return false;
	};
}

module.exports = SwissEliminationStageBehaviour;