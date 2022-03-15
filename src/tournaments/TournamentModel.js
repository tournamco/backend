class TournamentModel {
	constructor({name, game, stages, organizer, isPublic, color, teamSize}) {
		this.name = name;
		this.game = game;
        this.organizer = organizer;
        this.isPublic = isPublic;
        this.color = color;
        this.teamSize = teamSize;

        this.stages = [];

        for(const stage of stages) {
            this.stages.push(new StageModel(stage))
        }
	}


	toDocument() {
		return {
			name: this.name,
			game: this.game,
			stages: this.stages,
			organizer: this.organizer,
			isPublic: this.isPublic,
			color: this.color,
			teamSize: this.teamSize
		};
	}

	toPublicJSON() {
		return {
			name: this.name,
			game: this.game,
			stages: this.stages,
			organizer: this.organizer,
			isPublic: this.isPublic,
			color: this.color,
			teamSize: this.teamSize
		}
	}
}

module.exports = TournamentModel;