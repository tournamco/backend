const ApiErrors = require("../net/server/UserApiErrors");
const logger = require("../logging/Logger");
const Helpers = require("../Helpers");

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
		router.post("/team/match/list", (req, res) => this.listMatches(req, res));
		router.post("/team/match/resign", (req, res) => this.resign(req, res));
		router.post("/team/tournament/list", (req, res) => this.listTournaments(req, res));
		router.post("/team/info", (req, res) => this.info(req, res));
		router.post("/team/leave", (req, res) => this.leave(req, res));
		router.post("/team/list", (req, res) => this.list(req, res));
		router.post("/team/change", (req, res) => this.change(req, res));
		router.post("/team/delete", (req, res) => this.delete(req, res));
		router.post("/team/match/info", (req, res) => this.matchInfo(req, res));
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
			isPublic: data.isPublic,
			icon: undefined
		});

		const key = await this.tournaments.addTeam(tournament.id, team.id);

		if(key === undefined) {
			// TODO: delete the team again
			return res.send(ApiErrors.FULL_TOURNAMENT);
		}
		
		await this.teams.setKey(team.id, key);
		const invite = await this.teams.invites.create({team: team.id});

		logger.info(`An empty team was created with id ${team.id} for the tournament ${tournament.id}.`);

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

		if(data.icon == undefined || data.icon === "") {
			return res.send(ApiErrors.MISSING("icon"));
		}

		const team = await this.teams.create({
			name: data.name,
			leader: user.id,
			tournament: tournament.id,
			teamSize: tournament.teamSize,
			isPublic: data.isPublic,
			icon: data.icon
		});

		await this.teams.addMember(team.id, user.id);

		const key = await this.tournaments.addTeam(tournament.id, team.id);

		if(key === undefined) {
			// TODO: delete the team again
			return res.send(ApiErrors.FULL_TOURNAMENT);
		}
		
		await this.teams.setKey(team.id, key);

		logger.info(`A team was created with id ${team.id} for the tournament ${tournament.id}.`);

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

		if(team.leader == undefined) {
			await this.teams.setLeader(team.id, user.id);

			logger.info(`The user ${user.id} joined the team ${team.id} and became leader.`);

			return res.send({code: 200, id: team.id, leader: true}, 200);
		}

		logger.info(`A user ${user.id} joined the team ${team.id}.`);

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

		logger.info(`A team invite was created for the team ${team.id} in the tournament ${tournament.id}.`);

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

		logger.info(`The match ${match.id} was finished for the team ${team.id} in the tournament ${team.tournament}.`);

		if(!match.isFinished() || match.isDecided()) {
			return res.send({code: 200}, 200);
		}

		await this.matches.decide(match.id, team.tournament);
		await this.tournaments.matchFinished(team.tournament, match);

		logger.info(`The match ${match.id} was finished in the tournament ${team.tournament}.`);

		res.send({code: 200}, 200);
	}

	async listMatches(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		const pageNumber = data.pageNumber != undefined ? data.pageNumber : 0;
		const pageSize = data.pageSize != undefined ? data.pageSize : 10;

		const teams = await this.teams.getUserTeams(user);
		let matches = [];
		let tournaments = [];

		for(const team of teams) {
			const tournament = await this.tournaments.getModel({id: team.tournament});
			const tournamentMatches = tournament.getAllMatches();

			matches.push(...await this.matches.getArrayByIds(tournamentMatches));
			tournaments.push(tournament);
		}

		if(data.future) {
			matches = matches.filter(match => match.endDate >= new Date().getTime());
			matches = matches.sort((a, b) => a.startDate == b.startDate ? 0 : a.startDate > b.startDate ? 1 : -1);
		}
		else {
			matches = matches.filter(match => match.endDate < new Date().getTime());
			matches = matches.sort((a, b) => a.startDate == b.startDate ? 0 : a.startDate < b.startDate ? 1 : -1);
		}

		if(data.personal) {
			matches = matches.filter(match => Object.values(match.teams).filter(team => team != null).find(team => teams.find(myTeams => myTeams.id == team.id) != null) != null || match.keys.find(key => teams.find(myTeams => myTeams.key == key) != null) != null);
		}

		matches = Helpers.pageArray(matches, pageNumber, pageSize);

		const matchesData = [];

		for(const match of matches) {
			matchesData.push(await match.toPublicObject(match, tournaments.find(tournament => tournament.id === match.tournament), this.teams, this.users));
		}

		res.send({code: 200, matches: matchesData}, 200);
	}
	
	async listTournaments(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		const pageNumber = data.pageNumber != undefined ? data.pageNumber : 0;
		const pageSize = data.pageSize != undefined ? data.pageSize : 10;

		const teams = await this.teams.getUserTeams(user);
		let tournaments = [];

		for(const tournament of await this.tournaments.getOrganizingTournaments(user)) {
			if(tournament.stages[tournament.stages.length - 1].winners.length > 0) continue;

			tournaments.push(await tournament.toPublicObject(this.users));
		}

		for(const team of teams) {
			const tournament = await this.tournaments.getModel({id: team.tournament});

			if(tournament.stages[tournament.stages.length - 1].winners.length > 0 || tournaments.find(tourn => tourn.id = tournament.id) != null) continue;

			tournaments.push(await tournament.toPublicObject(this.users));
		}

		tournaments = Helpers.pageArray(tournaments, pageNumber, pageSize);

		res.send({code: 200, tournaments}, 200);
	}

	async info(req, res) {
		const data = await req.data;

		if(data.id == undefined || data.id == "") {
			return res.send(ApiErrors.MISSING("id"));
		}

		if(Array.isArray(data.id)) {
			const teams = [];

			for(const id of data.id) {
				const team = await this.teams.getModel({id});

				if(team == undefined) {
					return res.send(ApiErrors.NOT_FOUND);
				}

				teams.push(team);
			}

			res.send({code: 200, teams: await Promise.all(teams.map(async team => await team.toPublicObject(this.users)))}, 200);
		}
		else {
			const team = await this.teams.getModel({id: data.id});

			if(team == undefined) {
				return res.send(ApiErrors.NOT_FOUND);
			}

			res.send({code: 200, team: await team.toPublicObject(this.users)}, 200);
		}
	}

	async leave(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		if(data.id == undefined || data.id == "") {
			return res.send(ApiErrors.MISSING("id"));
		}

		const team = await this.teams.getModel({id: data.id});

		if(team == undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		if(team.members.indexOf(user.id) == -1 && user.id != team.leader) {
			return res.send(ApiErrors.UNAUTHORIZED);
		}

		let userId;

		if(user.id == team.leader && data.user != undefined) {
			userId = data.user;
		}
		else {
			userId = user.id;
		}

		await this.teams.removeMember(team.id, userId);

		logger.info(`User ${user.id} left team ${team.id}`);

		res.send({code: 200}, 200);
	}

	async list(req, res) {
		const data = await req.data;

		if(data.tournament == undefined || data.tournament == "") {
			return res.send(ApiErrors.MISSING("tournament"));
		}

		const tournament = await this.tournaments.getModel({id: data.tournament});

		if(tournament == undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		const teams = await this.teams.getArray({tournament: tournament.id});

		res.send({code: 200, teams: teams.map(team => team.toPublicObject(this.users))}, 200);
	}

	async change(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		if(data.id == undefined || data.id == "") {
			return res.send(ApiErrors.MISSING("id"));
		}

		if(data.field == undefined || data.field == "") {
			return res.send(ApiErrors.MISSING("field"));
		}

		if(data.value == undefined || data.value == "") {
			return res.send(ApiErrors.MISSING("value"));
		}

		const team = await this.teams.getModel({id: data.id});

		if(team == undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		if(team.leader != user.id) {
			return res.send(ApiErrors.NOT_AUTHORIZED);
		}

		switch(data.field) {
			case "name":
				await this.teams.changeName(team.id, data.value);
				break;
			case "isPublic":
				await this.teams.changeIsPublic(team.id, data.value);
				break;
			case "icon":
				await this.teams.changeIcon(team.id, data.value);
				break;
			default:
				return res.send(ApiErrors.INVALID_FIELD);
		}

		res.send({code: 200}, 200);
	}

	async resign(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		if(data.team == undefined || data.team == "") {
			return res.send(ApiErrors.MISSING("team"));
		}
		
		if(data.match == undefined || data.match == "") {
			return res.send(ApiErrors.MISSING("match"));
		}

		const team = await this.teams.getModel({id: data.team});

		if(team == undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		if(team.leader != user.id) {
			return res.send(ApiErrors.NOT_AUTHORIZED);
		}

		const match = await this.matches.getModel({id: data.match});

		if(match == undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		if(Object.values(match.teams).indexOf(team.id) > -1 || match.keys.indexOf(team.key) == -1) {
			return res.send(ApiErrors.NOT_AUTHORIZED);
		}

		await this.matches.setResignLoser(match.id, team.key, this.teams);

		logger.info(`User ${user.id} resigned from match ${match.id}`);

		res.send({code: 200}, 200);
	}

	async matchInfo(req, res) {
		const data = await req.data;

		if(data.match == undefined || data.match == "") {
			return res.send(ApiErrors.MISSING("match"));
		}

		const match = await this.matches.getModel({id: data.match});

		if(match == undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		const tournament = await this.tournaments.getModel({id: match.tournament});

		res.send({code: 200, match: await match.toPublicObject(match, tournament, this.teams, this.users)}, 200);
	}

	async delete(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		if(data.id == undefined || data.id == "") {
			return res.send(ApiErrors.MISSING("id"));
		}

		const team = await this.teams.getModel({id: data.id});

		if(team == undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		const tournament = await this.tournaments.getModel({id: team.tournament});

		if(tournament == undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		if(team.leader != user.id && tournament.organizer != user.id) {
			return res.send(ApiErrors.UNAUTHORIZED);
		}

		const matches = await this.matches.getAll({tournament: tournament.id});

		for(const match of matches) {
			if(Object.values(match.teams).indexOf(team.id) > -1) {
				return res.send(ApiErrors.ALREADY_PLAYING);				
			}
		}

		await this.tournaments.deleteTeam(team);
		await this.teams.delete({id: team.id});

		logger.info(`User ${user.id} deleted team ${team.id} for tournament ${tournament.id}`);

		res.send({code: 200}, 200);
	}
}

module.exports = TeamApi;