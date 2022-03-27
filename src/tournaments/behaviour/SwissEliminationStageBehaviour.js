const AbstractStageBehaviour = require("./AbstractStageBehaviour");

class SwissEliminationStageBehaviour extends AbstractStageBehaviour {
	constructor(stage) {
		super(stage);
	}

	getWinnersFromMatches(matchManager, teamManager) {};
	get matchLength() {};
	generateRounds(matchManager) {};
	isValid() {};
}

module.exports = SwissEliminationStageBehaviour;