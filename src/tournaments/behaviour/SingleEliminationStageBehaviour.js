const AbstractStageBehaviour = require("./AbstractStageBehaviour");

class SingleEliminationStageBehaviour extends AbstractStageBehaviour {
	constructor(stage) {
		super(stage);
	}

	getWinnersFromMatches(matchManager, teamManager) {};
	get matchLength() {};
	generateRounds(matchManager) {};
	isValid() {};
}

module.exports = SingleEliminationStageBehaviour;