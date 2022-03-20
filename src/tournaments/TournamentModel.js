const StageModel = require("./StageModel");

class TournamentModel {
	constructor({id, name, game, stages, teams, organizer, isPublic, color, teamSize, gameLength, currentStage}) {
		this.id = id;
		this.name = name;
		this.game = game;
		this.teams = teams;
        this.organizer = organizer;
        this.isPublic = isPublic;
        this.color = color;
        this.teamSize = teamSize;
        this.gameLength = gameLength;
        this.currentStage = currentStage;

        this.stages = stages.map(stage => new StageModel(stage, this));
	}

	addStage(stage) {
		this.stages.push(stage);
	}

	addTeam(team) {
		this.teams.push(team);
	}

	get maxParticipants() {
		if(this.stages.length === 0) return 0;
		
		return this.stages[0].numberOfParticipants;
	}

	getFreeKey() {
		if(this.stages.length === 0) return;

		return this.stages[0].freeKeys.shift();
	}

	toDocument() {
		return {
			id: this.id,
			name: this.name,
			game: this.game,
			teams: this.teams,
			stages: this.stages.map(stage => stage.toDocument()),
			organizer: this.organizer,
			isPublic: this.isPublic,
			color: this.color,
			teamSize: this.teamSize,
			gameLength: this.gameLength,
			currentStage: this.currentStage
		};
	}

	toPublicJSON() {
		return {
			id: this.id,
			name: this.name,
			game: this.game,
			teams: this.teams,
			stages: this.stages.map(stage => stage.toPublicJSON()),
			organizer: this.organizer,
			isPublic: this.isPublic,
			color: this.color,
			teamSize: this.teamSize,
			gameLength: this.gameLength,
			currentStage: this.currentStage
		}
	}
}

module.exports = TournamentModel;