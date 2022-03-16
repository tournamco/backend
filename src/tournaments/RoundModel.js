class RoundModel {
    constructor({id, name, matches}, parent) {
        this.id = id;
        this.name = name;
        this.matches = matches;
        this.stage = parent;
    }

    toDocument() {
        return {
            
        }
    }
}

module.exports = RoundModel;