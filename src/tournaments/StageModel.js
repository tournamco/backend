const RoundModel = require("./RoundModel");

class StageModel {
    constructor({id, name, numberOfParticipants, rounds, minimalDate, maximalDate}, parent) {
        this.id = id;
        this.name = name;
        this.numberOfParticipants = numberOfParticipants;
        this.rounds = rounds.map(round => new RoundModel(round, this));
        this.minimalDate = minimalDate;
        this.maximalDate = maximalDate;
        this.tournament = parent;
    }

    toDocument() {
        return {
            id: this.id,
            name: this.name,
            numberOfParticipants: this.numberOfParticipants,
            rounds: this.rounds.map(round => round.toDocument()),
            minimalDate: this.minimalDate,
            maximalDate: this.maximalDate
        };
    }
}

module.exports = StageModel;