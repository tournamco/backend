class TournamentModel {
	constructor({id, name, game, stages, teams, organizer, isPublic, color, teamSize}) {
		this.id = id;
		this.name = name;
		this.game = game;
		this.teams = teams;
        this.organizer = organizer;
        this.isPublic = isPublic;
        this.color = color;
        this.teamSize = teamSize;

        this.stages = stages.map(stage => new StageModel(stage, this));
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
			teamSize: this.teamSize
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
			teamSize: this.teamSize
		}
	}
}

module.exports = TournamentModel;