const ApiErrors = require("../net/server/UserApiErrors");
const logger = require("../logging/Logger");

class TeamApi {
	constructor(router, teams, matches, users, tournaments) {
		this.teams = teams;
		this.users = users;
		this.matches = matches;
		this.tournaments = tournaments;

		router.post("/team/create", (req, res) => this.create(req, res));
		router.post("/team/join", (req, res) => this.join(req, res));
		router.post("/team/invite/create", (req, res) => this.createInvite(req, res));
		router.post("/team/match/finish", (req, res) => this.finishMatch(req, res));
	}

	async create(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		if(data.tournament == undefined || data.tournament === "") {
			return res.send(ApiErrors.MISSING("tournament"));
		}

		if(data.isPublic == undefined || data.isPublic === "") {
			return res.send(ApiErrors.MISSING("is public"));
		}

		const tournament = await this.tournaments.get({id: data.tournament});

		if(tournament === undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		if(user.id !== tournament.organizer && !tournament.isPublic) {
			return res.send(ApiErrors.UNAUTHORIZED);
		}

		let name;

		if(data.name != undefined && data.name !== "") {
			name = data.name;
		}
		else if(user.id === tournament.organizer) {
			name = "Temporary name";
		}
		else {
			return res.send(ApiErrors.MISSING("name"));
		}

		const team = await this.teams.create({
			name,
			leader: user.id,
			tournament: tournament.id,
			teamSize: tournament.teamSize,
			isPublic: data.isPublic
		});

		if(user.id !== tournament.organizer || data.join) {
			await this.teams.addMember(team.id, user.id);
		}

		const key = await this.tournaments.addTeam(tournament.id, team.id);

		if(key === undefined) {
			// TODO: delete the team again
			return res.send(ApiErrors.FULL_TOURNAMENT);
		}
		
		await this.teams.setKey(team.id, key);

		logger.debug(`A team was created with id ${team.id} for the tournament ${tournament.id}.`);

		res.send({code: 200, id: team.id}, 200);
	}

	async join(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		let id;

		if(data.token !== undefined) {
			if(!this.teams.invites.check(data.token)) {
				return res.send(ApiErrors.INCORRECT_TOKEN);
			}

			id = await this.teams.invites.getTeamFromToken(data.token);
		}
		else {
			id = data.team;
		}

		const team = await this.teams.get({id});

		if(data.token === undefined && !team.isPublic) {
			return res.send(ApiErrors.UNAUTHORIZED);
		}

		if(await this.teams.checkIfInTournament(team.tournament, user.id)) {
			return res.send(ApiErrors.ALREADY_IN_TOURNAMENT);
		}

		if(team.members.length === team.teamSize) {
			return res.send(ApiErrors.FULL_TEAM);
		}

		await this.teams.addMember(team.id, user.id);
		await this.teams.invites.drop(data.token);

		res.send({code: 200, id: team.id, leader: user.id === team.leader}, 200);
	}

	async createInvite(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		if(data.tournament == undefined || data.tournament === "") {
			return res.send(ApiErrors.MISSING("tournament"));
		}

		if(data.team == undefined || data.team === "") {
			return res.send(ApiErrors.MISSING("team"));
		}

		const team = await this.teams.get({id: data.team});

		if(team === undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		const tournament = await this.tournaments.get({id: data.tournament});

		if(tournament === undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		if(user.id !== tournament.organizer && user.id !== team.leader) {
			return res.send(ApiErrors.UNAUTHORIZED);
		}

		const token = await this.teams.invites.create({
			team: team.id,
			maxAge: data.maxAge
		});

		res.send({code: 200, token}, 200);
	}

	async finishMatch(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		if(data.match == undefined || data.match === "") {
			return res.send(ApiErrors.MISSING("match"));
		}

		let match = await this.matches.get({id: data.match});

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

		await this.matches.setFinished(match.id, team.key, team.id);

		match = await this.matches.getModel({id: match.id});

		if(!match.isFinished() || match.isDecided()) {
			res.send({code: 200}, 200);
		}

		await this.matches.decide(match.id, team.tournament);

		this.tournaments.matchFinished(team.tournament, match);
	}
}

module.exports = TeamApi;