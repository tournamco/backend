class AbstractStageBehaviour {
	constructor(stage) {
		this.stage = stage;
	}

	getWinnersFromMatches(matchManager, teamManager) {};
	get matchDefaultLength() {};
	getMatchLength() {};
	generateRounds(matchManager) {};
	isValid() {};
}

module.exports = AbstractStageBehaviour;