const logger = require("../logging/Logger");
const ApiErrors = require("../net/server/UserApiErrors");

class TournamentApi {
	constructor(tournaments, users, router) {
		this.tournaments = tournaments;
		this.users = users;

		router.post("/tournament/create", (req, res) => this.create(req, res));
	}

	async create(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		if(data.name == undefined || data.name === "") {
			return res.send(ApiErrors.MISSING("name"));
		}

		if(data.color == undefined || data.color === "") {
			return res.send(ApiErrors.MISSING("color"));
		}

		if(data.game == undefined || data.game === "") {
			return res.send(ApiErrors.MISSING("game"));
		}

		if(data.teamSize == undefined || data.teamSize === "") {
			return res.send(ApiErrors.MISSING("team size"));
		}

		if(data.stages == undefined) {
			return res.send(ApiErrors.MISSING("stages"));
		}

		if(data.isPublic == undefined) {
			return res.send(ApiErrors.MISSING("is public"));
		}

		if(data.gameLength == undefined) {
			return res.send(ApiErrors.MISSING("game length"));
		}

		const tournament = await this.tournaments.create({
			name: data.name,
			color: data.color,
			organizer: user,
			teamSize: data.teamSize,
			game: data.game,
			isPublic: data.isPublic,
			gameLength: data.gameLength,
			stages: data.stages
		});

		if(tournament === undefined) {
			return res.send(ApiErrors.INCORRECT_OPTION_VALUES);
		}

		logger.debug(`A tournament was created with id ${tournament.id}.`);

		res.send({code: 200, id: tournament.id}, 200);
	}
}

module.exports = TournamentApi;