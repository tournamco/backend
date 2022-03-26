class AbstractStageBehaviour {
	constructor(stage) {
		this.stage = stage;
	}

	getWinnersFromMatches(matchManager, teamManager) {};
	get matchLength() {};
	generateRounds(matchManager) {};
	isValid() {};
}

module.exports = AbstractStageBehaviour;