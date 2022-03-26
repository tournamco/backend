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

		if(user.id === tournament.organizer && !data.join) {
			await this.createEmptyTeam(data, res, tournament);
		}
		else {
			await this.createNormalTeam(data, res, user, tournament);
		}
	}

	async createEmptyTeam(data, res, tournament) {
		const team = await this.teams.create({
			name: "Temporary Name",
			leader: undefined,
			tournament: tournament.id,
			teamSize: tournament.teamSize,
			isPublic: data.isPublic
		});

		const key = await this.tournaments.addTeam(tournament.id, team.id);

		if(key === undefined) {
			// TODO: delete the team again
			return res.send(ApiErrors.FULL_TOURNAMENT);
		}
		
		await this.teams.setKey(team.id, key);
		const invite = await this.teams.invites.create({team: team.id});

		logger.debug(`An empty team was created with id ${team.id} for the tournament ${tournament.id}.`);

		res.send({code: 200, id: team.id, token: invite}, 200);
	}

	async createNormalTeam(data, res, user, tournament) {
		if(data.name == undefined || data.name === "") {
			return res.send(ApiErrors.MISSING("name"));
		}

		if(await this.teams.nameExists(data.name)) {
			return res.send(ApiErrors.ALREADY_USED_NAME);
		}

		if(await this.teams.checkIfInTournament(tournament.id, user.id)) {
			return res.send(ApiErrors.ALREADY_IN_TOURNAMENT);
		}

		if(await this.teams.checkIfLeaderInTournament(tournament.id, user.id)) {
			return res.send(ApiErrors.ALREADY_IN_TOURNAMENT_LEADER);
		}

		const team = await this.teams.create({
			name: data.name,
			leader: user.id,
			tournament: tournament.id,
			teamSize: tournament.teamSize,
			isPublic: data.isPublic
		});

		await this.teams.addMember(team.id, user.id);

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

		if(team.leader === undefined) {
			await this.teams.setLeader(team.id, user.id);
			return res.send({code: 200, id: team.id, leader: true}, 200);
		}

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

		// FIX

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

		if(await this.matches.isFinished(match.id, team.key)) {
			return res.send(ApiErrors.ALREADY_FINISHED);
		}

		await this.matches.setFinished(match.id, team.key, team.id);

		match = await this.matches.getModel({id: match.id});

		if(!match.isFinished() || match.isDecided()) {
			return res.send({code: 200}, 200);
		}

		await this.matches.decide(match.id, team.tournament);

		await this.tournaments.matchFinished(team.tournament, match);
	}
}

module.exports = TeamApi;