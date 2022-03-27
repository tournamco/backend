const logger = require("../logging/Logger");
const ApiErrors = require("../net/server/UserApiErrors");

class TournamentApi {
	constructor(tournaments, users, router) {
		this.tournaments = tournaments;
		this.users = users;

		router.get("/tournament/info", (req, res) => this.create(req, res));
		router.post("/tournament/create", (req, res) => this.create(req, res));
		router.post("/tournament/delete", (req, res) => this.delete(req, res));
		router.post("/tournament/match/list", (req, res) => this.listMatches(req, res));
		router.post("/tournament/round/list", (req, res) => this.listRoundMatches(req, res));
	}

	async info(req, res) {
		const data = await req.data;

		if(data.tournament == undefined || data.tournament === "") {
			return res.send(ApiErrors.MISSING("tournament"));
		}

		const tournament = this.tournaments.get({id: data.tournament});

		if(tournament == null) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		res.send({code: 200, tournament: tournament.toPublicObject()}, 200);
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

		if(!data.online && data.location == undefined) {
			return res.send(ApiErrors.MISSING("location"));
		}

		const tournament = await this.tournaments.create({
			name: data.name,
			color: data.color,
			organizer: user,
			teamSize: data.teamSize,
			game: data.game,
			isPublic: data.isPublic,
			gameLength: data.gameLength,
			stages: data.stages,
			banner: data.banner,
			online: data.online,
			location: data.location
		});

		if(tournament === undefined) {
			return res.send(ApiErrors.INCORRECT_OPTION_VALUES);
		}

		logger.debug(`A tournament was created with id ${tournament.id}.`);

		res.send({code: 200, id: tournament.id}, 200);
	}

	async delete(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		if(data.tournament == undefined || data.tournament === "") {
			return res.send(ApiErrors.MISSING("tournament"));
		}

		const tournament = await this.tournaments.getModel({id: data.tournament});

		if(tournament == null) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		if(tournament.organizer != user.id) {
			return res.send(ApiErrors.UNAUTHORIZED);
		}

		await this.tournaments.deleteById(tournament.id);

		res.send({code: 200}, 200);
	}

	async listMatches(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		if(data.tournament == undefined || data.tournament === "") {
			return res.send(ApiErrors.MISSING("tournament"));
		}

		const tournament = await this.tournaments.getModel({id: data.tournament});
		const teams = await this.tournaments.getTeams(tournament.id);

		let matches = tournament.getAllMatches();
		matches = await this.matches.getArrayByIds(matches);

		if(data.future) {
			matches = matches.filter(match => match.endDate >= new Date().getTime());
			matches = matches.sort((a, b) => a.startDate == b.startDate ? 0 : a.startDate > b.startDate ? 1 : -1);
		}
		else {
			matches = matches.filter(match => match.endDate < new Date().getTime());
			matches = matches.sort((a, b) => a.startDate == b.startDate ? 0 : a.startDate < b.startDate ? 1 : -1);
		}

		matches = Helpers.pageArray(matches, pageNumber, pageSize);

		const matchesData = [];

		for(const match of matches) {
			const teamsData = {};

			for(const key of match.keys) {
				let team;

				if(match.teams != undefined && match.teams[key] != undefined) {
					team = teams.find(team => team.id === match.teams[key]);
				}
				else {
					team = teams.find(team => team.key === key);
				}

				if(team == undefined) continue;

				teamsData[key] = {id: team.id, name: team.name};
			}

			matchesData.push({
				id: match.id,
				name: match.name,
				startDate: match.startDate,
				endDate: match.endDate,
				color: tournament.color,
				scores: match.scores,
				teams: teamsData,
				keys: match.keys
			});
		}

		res.send({code: 200, matches: matchesData}, 200);
	}

	async listRoundMatches(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		if(data.tournament == undefined || data.tournament === "") {
			return res.send(ApiErrors.MISSING("tournament"));
		}

		if(data.stage == undefined) {
			return res.send(ApiErrors.MISSING("stage"));
		}

		if(data.round == undefined) {
			return res.send(ApiErrors.MISSING("round"));
		}

		const tournament = await this.tournaments.getModel({id: data.tournament});
		const teams = await this.tournaments.getTeams(tournament.id);

		let stage = tournament.stages[data.stage];

		if(stage == undefined) {
			return res.send(ApiErrors.STAGE_NOT_FOUND);
		}

		let round = stage.rounds[data.round];

		if(round == undefined) {
			return res.send(ApiErrors.ROUND_NOT_FOUND);
		}

		let matches = await this.matches.getArrayByIds(round.matches);

		
		matches = matches.sort((a, b) => a.startDate == b.startDate ? 0 : a.startDate > b.startDate ? 1 : -1);

		const matchesData = [];

		for(const match of matches) {
			const teamsData = {};

			for(const key of match.keys) {
				let team;

				if(match.teams != undefined && match.teams[key] != undefined) {
					team = teams.find(team => team.id === match.teams[key]);
				}
				else {
					team = teams.find(team => team.key === key);
				}

				if(team == undefined) continue;

				teamsData[key] = {id: team.id, name: team.name};
			}

			matchesData.push({
				id: match.id,
				name: match.name,
				startDate: match.startDate,
				endDate: match.endDate,
				color: tournament.color,
				scores: match.scores,
				teams: teamsData,
				keys: match.keys
			});
		}

		res.send({code: 200, matches: matchesData}, 200);
	}
}

module.exports = TournamentApi;