const { nanoid } = require("nanoid");
const TeamModel = require("./TeamModel");
const TeamApi = require("./TeamApi");
const InviteManager = require("./InviteManager");

class TeamManager {
	constructor({router, users, matches, tournaments}) {
		new TeamApi(router, this, matches, users, tournaments);
		this.tournaments = tournaments;
		this.invites = new InviteManager(this);
	}

	init({database}) {
		this.collection = database.collection("teams");
		this.invites.init({database});
	}

	async create({name, leader, tournament, teamSize, isPublic}) {
		const id = nanoid(16);
		const team = new TeamModel({id, name, leader, tournament, teamSize, isPublic, members: []});

		await this.collection.insertOne(team.toDocument());

		return team;
	}

	async addMember(id, member) {
		const team = this.getModel({id});

		if(team.members.length === team.teamSize) return;

		team.addMember(member);

		await this.collection.replaceOne({id}, team.toDocument());
	}

	async setLeader(id, user) {
		const team = this.getModel({id});

		team.setLeader(user);

		await this.collection.replaceOne({id}, team.toDocument());
	}

	async removeMember(id, member) {
		const team = this.getModel({id});

		if(team.members.length === team.teamSize) return;

		team.removeMember(member);

		await this.collection.replaceOne({id}, team.toDocument());
	}

	async checkIfInTournament(id, user) {
		const tournament = await this.tournaments.getModel({id});

		for(const id of tournament.teams) {
			const team = await this.get({id});
			
			if(team.members.includes(user)) return true;
		}

		return false;
	}

	async checkIfLeaderInTournament(id, user) {
		const tournament = await this.tournaments.getModel({id});

		for(const id of tournament.teams) {
			const team = await this.get({id});
			
			if(team.leader == user) return true;
		}

		return false;
	}

	async updateKeys(match) {
		if(match.newKeys == undefined) return;

		for(let team of match.teams) {
			team = await this.getModel({id: team});

			if(match.isWinner(team.key)) {
				await this.teams.setNewKey(team.id, match.newKeys[0]);
			}
			else {
				await this.teams.setNewKey(team.id, match.newKeys[1]);
			}
		}
	}

	async nameExists(name) {
		const documents = await (await this.collection.find({name})).toArray();

		return documents.length > 0;
	}

	setKey(id, key) {
		return this.collection.updateOne({id}, {$set: {key}});
	}

	get(data) {
		return this.collection.findOne(data);
	}

	async getModel(data) {
		const contents = await this.get(data);

		if(contents == undefined) return;

        return new TeamModel(contents);
	}
}

module.exports = TeamManager;