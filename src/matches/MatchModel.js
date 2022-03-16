class MatchModel {
	constructor({name, tournament, stage, round, startdate, teams}) {
		this.name = name;
		this.type = type;
		this.datetime = datetime;
	}

	toDocument() {
		return {
			name: this.name,
			type: this.type,
			datetime: this.datetime
		};
	}

	toPublicJSON() {
		return {
			name: this.name,
			type: this.type,
			datetime: this.datetime
		}
	}
}

module.exports = MatchModel;