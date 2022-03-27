const AbstractStageBehaviour = require("./AbstractStageBehaviour");

class DoubleEliminationStageBehaviour extends AbstractStageBehaviour {
	constructor(stage) {
		super(stage);
	}

	getWinnersFromMatches(matchManager, teamManager) {};
	get matchLength() {};
	generateRounds(matchManager) {};
	isValid() {};
}

module.exports = DoubleEliminationStageBehaviour;