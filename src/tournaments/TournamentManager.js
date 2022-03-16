class TournamentManager {
    constructor({database}) {
        this.collection = database.collection("tournament");
    }
}

module.exports = TournamentManager;