const { nanoid } = require("nanoid");
const moment = require("moment");
const RoundModel = require("./RoundModel");
const PoolsStageBehaviour = require("./behaviour/PoolsStageBehaviour");

class StageModel {
    constructor({id, type, name, numberOfParticipants, rounds, minimalDate, maximalDate, minimalTime, maximalTime, options, freeKeys, winners}, parent) {
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
        this.winners = winners;
        this.tournament = parent;
        this.behaviour = this.getTypedBehaviour(this.type);
    }

    getTypedBehaviour(type) {
        switch(type) {
            case "pools":
                return new PoolsStageBehaviour(this);
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

    addWinner() {

    }

    get matchLength() {
        return this.behaviour.matchLength;
    }

    generateRounds(matchManager) {
        return this.behaviour.generateRounds(matchManager);
    }

    isValid() {
        return this.behaviour.isValid();
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
            freeKeys: this.freeKeys,
            winners: this.winners
        };
    }
}

module.exports = StageModel;