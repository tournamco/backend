class DisputeApi {
	constructor(router, tournaments, proofs, matches, disputes) {
		this.proofs = proofs;
		this.tournaments = tournaments;
		this.matches = matches;
		this.disputes = disputes;

		router.post("/dispute/resolve", (req, res) => this.resolve(req, res));
	}

	resolve(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		if(data.dispute == undefined || data.dispute === "") {
			return res.send(ApiErrors.MISSING("dispute"));
		}

		if(data.key == undefined || data.key === "") {
			return res.send(ApiErrors.MISSING("key"));
		}

		const dispute = await this.disputes.get({id: data.dispute});
		
		if(dispute === undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		const match = await this.matches.getModel({id: dispute.match});

		if(match === undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		const tournament = await this.tournaments.getModel({id: match.tournament});

		if(tournament === undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		if(user.id !== tournament.organizer) {
			return res.send(ApiErrors.UNAUTHORIZED);
		}

		const game = match.getGame(dispute.game);
		await game.setScores(await this.proofs.getModel({id: game.proofs[data.key]}));

		this.tournaments.matchFinished(tournament.id, match);
	}
}

module.exports = DisputeApi;