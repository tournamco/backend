const logger = require("../logging/Logger");
const ApiErrors = require("../net/server/UserApiErrors");
const Router = require("../net/server/Router");
const TournamentManager = require('../tournaments/TournamentManager');
const ProofManager = require('../proofs/ProofManager');
const MatchManager = require('../matches/MatchManager');
const DisputesManager = require('../disputes/DisputesManager');

/**
 * This class contains the API handlers for the disputes.
 */
class DisputeApi {
	/**
	 * Constructor for the dispute api, it will register the api handlers.
	 * @param {Router} router The router to attach the api to.
	 * @param {TournamentManager} tournaments The tournaments manager.
	 * @param {UserManager} users The user manager.
	 * @param {ProofManager} proofs The proofs manager.
	 * @param {MatchManager} matches  The matches manager.
	 * @param {DisputesManager} disputes The disputes manager.
	 */
	constructor(router, tournaments, users, proofs, matches, disputes) {
		this.proofs = proofs;
		this.tournaments = tournaments;
		this.users = users;
		this.matches = matches;
		this.disputes = disputes;

		router.post("/dispute/resolve", (req, res) => this.resolve(req, res));
		router.post("/dispute/list", (req, res) => this.list(req, res));
	}

	/**
	 * Resolves a dispute. The user can set the id of the dispute as "dispute" and the key of the team that won with "key".
	 * @param {JSONHTTPRequest} req The request.
	 * @param {JSONHTTPResponse} res The response. 
	 * @returns 
	 */
	async resolve(req, res) {
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
		const proof = await this.proofs.getModel({id: game.proofs[data.key]});
		
		await this.matches.setGameScores(match.id, dispute.game, proof.scores);
		await this.disputes.remove({id: dispute.id});
		await this.tournaments.matchFinished(tournament.id, match);

		logger.info(`Dispute resolved for match ${match.id} with id ${dispute.id} by ${user.id}`);

		res.send({code: 200}, 200);
	}

	async list(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}
		
		if(data.tournament == undefined || data.tournament === "") {
			return res.send(ApiErrors.MISSING("tournament"));
		}

		const tournament = await this.tournaments.getModel({id: data.tournament});

		if(tournament === undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		if(user.id !== tournament.organizer) {
			return res.send(ApiErrors.UNAUTHORIZED);
		}

		const disputes = await this.disputes.getAll({tournament: tournament.id});

		res.send({code: 200, disputes: disputes});
	}
}

module.exports = DisputeApi;