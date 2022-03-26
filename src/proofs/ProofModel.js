class ProofModel {
	constructor({id, scores, images, team}) {
		this.id = id;
		this.scores = scores;
		this.images = images;
		this.team = team;
	}

	toDocument() {
		return {
			id: this.id,
			scores: this.scores,
			images: this.images,
			team: this.team
		};
	}
}

module.exports = ProofModel;