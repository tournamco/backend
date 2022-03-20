const ApiErrors = require("../net/server/UserApiErrors");

class ProofApi {
	constructor(router, matches, users, teams, proofs) {
		this.proofs = proofs;
		this.matches = matches;
		this.teams = teams;
		this.users = users;
		
		router.post("/proof/create", (req, res) => this.create(req, res));
		router.post("/proof/image/add", (req, res) => this.addImage(req, res));
	}

	async create(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		if(data.match == undefined || data.match === "") {
			return res.send(ApiErrors.MISSING("match"));
		}
		
		if(data.game === undefined || data.game === "") {
			return res.send(ApiErrors.MISSING("game"));
		}

		const match = await this.matches.getModel({id: data.match});

		if(match === undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		let team;
		
		for(const key of match.keys) {
			const teamFromKey = await this.teams.get({key});
			
			if(teamFromKey == null || user.id != teamFromKey.leader) continue;

			team = teamFromKey;
			break;
		}

		if(team === undefined) {
			return res.send(ApiErrors.UNAUTHORIZED);
		}

		const game = match.getGame(data.game);

		if(game === undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		if(game.proofs[team.key] != undefined) {
			return res.send(ApiErrors.PROOF_ALREADY_SET);
		}

		const proof = await this.proofs.create({
			keys: match.keys
		});

		await this.matches.addGameProof(match, game, team.key, proof.id);

		res.send({code: 200, id: proof.id}, 200);
	}

	remove() {

	}

	async addImage(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		if(data.match == undefined || data.match === "") {
			return res.send(ApiErrors.MISSING("match"));
		}

		if(data.proof == undefined || data.proof === "") {
			return res.send(ApiErrors.MISSING("proof"));
		}

		if(data.image == undefined || data.image === "") {
			return res.send(ApiErrors.MISSING("image"));
		}

		const match = await this.matches.getModel({id: data.match});

		if(match === undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		let team;
		
		for(const key of match.keys) {
			const teamFromKey = await this.teams.get({key});
			
			if(teamFromKey == null || user.id != teamFromKey.leader) continue;

			team = teamFromKey;
			break;
		}

		if(team === undefined) {
			return res.send(ApiErrors.UNAUTHORIZED);
		}

		await this.proofs.addImage(data.proof, data.image);

		res.send({code: 200}, 200);
	}

	removeImage() {

	}
}

module.exports = ProofApi;