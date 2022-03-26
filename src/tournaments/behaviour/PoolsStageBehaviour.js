const RoundModel = require("../RoundModel");
const AbstractStageBehaviour = require("./AbstractStageBehaviour");

class PoolsStageBehaviour extends AbstractStageBehaviour {
	constructor(stage) {
		super(stage);
	}

	getWinnersFromMatches(matchManager, teamManager) {
		const teams = {};

        for(const round of this.stage.rounds) {
            for(let match of round.matches) {
                match = matchManager.getModel({id: match});
                //const winner = 

                //if(teams[])
            }
        }
	}

	get matchLength() {
		return this.stage.options.bestOf * this.stage.tournament.gameLength;
	}

	generateRounds(matchManager) {
		let rounds = [];
        const numberOfPools = Math.ceil(this.stage.numberOfParticipants / this.stage.options.poolSize);
        const pools = [];
        const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        for(let i = 0; i < numberOfPools; i++) {
            const pool = [];

            for(let j = 0; j < this.stage.options.poolSize; j++) {
                const id = nanoid(8);
                pool.push(id);
                this.stage.freeKeys.push(id);
            }
            
            pools.push(pool);
        }

        this.stage.options.pools = pools;

        for(let i = 0; i < this.stage.options.matchesPerPool; i++) {
            const round = new RoundModel({id: nanoid(16), name: `Round ${i+1}`, matches: []}, this.stage);
            
            for(let j = 0; j < pools.length; j++) {
                let pool = pools[j];
                let x = 0;

                for(let l = 0; l < pool.length/2; l++) {
                    const match = await matchManager.create({name: `Match ${ALPHABET.charAt(j)}${x+1}`, keys: [pool[l], pool[pool.length-l-1]], tournament: this.stage.tournament.id}, this.stage.options.bestOf);
                    round.addMatch(match);
                    x++;
                }

                const last = pool.pop();
                pools[j].splice(1, 0, last);
            }

            rounds.push(round);
        }

        return rounds;
	}

	isValid() {
		if(this.stage.options.poolSize <= 0) return false;
        if(this.stage.options.poolSize%2 == 1) return false;
        if(this.stage.options.numberOfWinners <= 0) return false;
        if(this.stage.options.matchesPerPool <= 0) return false;
        if(this.stage.options.bestOf <= 0) return false;
        if(this.stage.options.numberOfWinners > this.stage.options.poolSize) return false;

		return true;
	}
}

module.exports = PoolsStageBehaviour;