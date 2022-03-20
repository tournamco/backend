const { nanoid } = require("nanoid");
const moment = require("moment");
const RoundModel = require("./RoundModel");

class StageModel {
    constructor({id, type, name, numberOfParticipants, rounds, minimalDate, maximalDate, minimalTime, maximalTime, options, freeKeys}, parent) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.numberOfParticipants = numberOfParticipants;
        this.rounds = rounds.map(round => new RoundModel(round, this));
        this.minimalDate = moment(minimalDate, "YYYY-MM-DD");
        this.minimalTime = moment(minimalTime, "hh:mm");
        this.maximalDate = moment(maximalDate, "YYYY-MM-DD");
        this.maximalTime = moment(maximalTime, "hh:mm");
        this.options = options;
        this.freeKeys = freeKeys;
        this.tournament = parent;
    }

    getWinners(matchManager, teamManager) {
        switch(this.type) {
            case "pools":
                return getPoolsWinners(matchManager, teamManager);
        }
    }

    getPoolsWinners(matchManager, teamManager) {
        const teams = {};

        for(const round of this.rounds) {
            for(let match of round.matches) {
                match = matchManager.getModel({id: match});
                const winner = 

                if(teams[])
            }
        }
    }

    get matchLength() {
        switch(this.type) {
            case "pools":
                return this.options.bestOf * this.tournament.gameLength;
        }
    }

    generateRounds(matchManager) {
        switch(this.type) {
            case "pools":
                return this.generatePoolsRounds(matchManager);
        }
    }

    async generatePoolsRounds(matchManager) {
        let rounds = [];
        const numberOfPools = Math.ceil(this.numberOfParticipants / this.options.poolSize);
        const pools = [];
        const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        for(let i = 0; i < numberOfPools; i++) {
            const pool = [];

            for(let j = 0; j < this.options.poolSize; j++) {
                const id = nanoid(8);
                pool.push(id);
                this.freeKeys.push(id);
            }
            
            pools.push(pool);
        }

        this.options.pools = pools;

        for(let i = 0; i < this.options.matchesPerPool; i++) {
            const round = new RoundModel({id: nanoid(16), name: `Round ${i+1}`, matches: []}, this);
            
            for(let j = 0; j < pools.length; j++) {
                let pool = pools[j];
                let x = 0;

                for(let l = 0; l < pool.length/2; l++) {
                    const match = await matchManager.create({name: `Match ${ALPHABET.charAt(j)}${x+1}`, keys: [pool[l], pool[pool.length-l-1]]}, this.options.bestOf);
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
        switch(this.type) {
            case "pools":
                if(this.options.poolSize <= 0) return false;
                if(this.options.poolSize%2 == 1) return false;
                if(this.options.numberOfWinners <= 0) return false;
                if(this.options.matchesPerPool <= 0) return false;
                if(this.options.bestOf <= 0) return false;
                if(this.options.numberOfWinners > this.options.poolSize) return false;
                break;
            case "single":
                break;
            case "double":
                break;
            case "swiss":
                break;
        }

        return true;
    }

    toDocument() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            numberOfParticipants: this.numberOfParticipants,
            rounds: this.rounds.map(round => round.toDocument()),
            minimalDate: this.minimalDate.format("YYYY-MM-DD"),
            minimalTime: this.minimalTime.format("hh:mm"),
            maximalDate: this.maximalDate.format("YYYY-MM-DD"),
            maximalTime: this.maximalTime.format("hh:mm"),
            options: this.options,
            freeKeys: this.freeKeys
        };
    }
}

module.exports = StageModel;