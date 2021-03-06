const moment = require("moment");
const RoundModel = require("./RoundModel");
const PoolsStageBehaviour = require("./behaviour/PoolsStageBehaviour");
const SwissEliminationStageBehaviour = require("./behaviour/SwissEliminationStageBehaviour");
const SingleEliminationStageBehaviour = require("./behaviour/SingleEliminationStageBehaviour");
const DoubleEliminationStageBehaviour = require("./behaviour/DoubleEliminationStageBehaviour");

class StageModel {
    constructor({type, name, numberOfParticipants, rounds, minimalDate, maximalDate, minimalTime, 
            maximalTime, options, freeKeys, winners}, parent) {
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
        this.winners = winners;
        this.tournament = parent;
        this.behaviour = this.getTypedBehaviour(this.type);
    }

    getTypedBehaviour(type) {
        switch(type) {
            case "pools":
                return new PoolsStageBehaviour(this);
            case "swiss":
                return new SwissEliminationStageBehaviour(this);
            case "single":
                return new SingleEliminationStageBehaviour(this);
            case "double":
                return new DoubleEliminationStageBehaviour(this);
        }
    }

    async isFinished(matchManager) {
        for(const round of this.rounds) {
            for(const id of round.matches) {
                const match = await matchManager.getModel({id});

                if(match === undefined) continue;
                if(match.isDecided()) continue;

                return false;
            }
        }

        return true;
    }

    getWinnersFromMatches(matchManager, teamManager) {
        return this.behaviour.getWinnersFromMatches(matchManager, teamManager);
    }

    addWinner(winner) {
        this.winners.push(winner);
    }

    get defaultMatchLength() {
        return this.options.bestOf * this.tournament.gameLength;
    }

    generateRounds(matchManager) {
        return this.behaviour.generateRounds(matchManager);
    }

    isValid() {
        return this.behaviour.isValid();
    }

    toDocument() {
        return {
            type: this.type,
            name: this.name,
            numberOfParticipants: this.numberOfParticipants,
            rounds: this.rounds.map(round => round.toDocument()),
            minimalDate: this.minimalDate.format("YYYY-MM-DD"),
            minimalTime: this.minimalTime.format("hh:mm"),
            maximalDate: this.maximalDate.format("YYYY-MM-DD"),
            maximalTime: this.maximalTime.format("hh:mm"),
            options: this.options,
            freeKeys: this.freeKeys,
            winners: this.winners
        };
    }

    toPublicObject() {
        return {
            type: this.type,
            name: this.name,
            numberOfParticipants: this.numberOfParticipants,
            rounds: this.rounds.map(round => round.toPublicObject()),
            minimalDate: this.minimalDate.format("YYYY-MM-DD"),
            minimalTime: this.minimalTime.format("hh:mm"),
            maximalDate: this.maximalDate.format("YYYY-MM-DD"),
            maximalTime: this.maximalTime.format("hh:mm"),
            winners: this.winners,
            options: this.options
        };
    }
}

module.exports = StageModel;