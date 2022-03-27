class GameModel {
	constructor({scores, proofs}) {
		this.scores = scores;
		this.proofs = proofs;
	}

	isDecided() {
		for(const key of Object.keys(this.scores)) {
			if(this.scores[key] != undefined) continue;
			if(this.proofs[key] == undefined) continue;

			return false;
		}

		return true;
	}

	async areScoresUndisputed(proofManager) {
		const proofs = await this.getSetProofs(proofManager);

		for(const key of Object.keys(this.proofs)) {
			const scores = proofs.reduce((list, proof) => {
				const score = proof.scores[key];

				if(!list.includes(score)) list.push(score);

				return list;
			}, []);

			if(scores.length <= 1) continue;

			return false;
		}

		return true;
	}

	getSetProofs(proofManager) {
		return Promise.all(Object.keys(this.proofs)
			.filter(key => this.proofs[key] != undefined)
			.map(key => proofManager.getModel({id: this.proofs[key]})));
	}

	setScores(scores) {
		this.scores = scores;
	}

	getWinners() {
		const winners = [];
		const winningScore = 0;

		for(const key of Object.keys(this.scores)) {
			const score = this.scores[key];

			if(score > winningScore) {
				winners = [key];
			}
			else if(score === winningScore) {
				winners.push(key);
			}
		}

		return winners;
	}

	toPublicObject() {
		return {
			scores: this.scores,
			proofs: this.proofs
		}
	}

	toDocument() {
		return {
			scores: this.scores,
			proofs: this.proofs
		}
	}
}

module.exports = GameModel;