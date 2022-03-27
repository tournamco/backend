class RoundModel {
    constructor({id, name, matches}, parent) {
        this.id = id;
        this.name = name;
        this.matches = matches;
        this.stage = parent;
    }

    addMatch(match) {
        this.matches.push(match.id);
    }

    toDocument() {
        return {
            id: this.id,
            name: this.name,
            matches: this.matches
        }
    }

    toPublicObject() {
        return {
            name: this.name,
            matches: this.matches
        }
    }
}

module.exports = RoundModel;