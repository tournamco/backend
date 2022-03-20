class ProofModel {
	constructor({id, scores, images}) {
		this.id = id;
		this.scores = scores;
		this.images = images;
	}

	toDocument() {
		return {
			id: this.id,
			scores: this.scores,
			images: this.images
		};
	}
}

module.exports = ProofModel;