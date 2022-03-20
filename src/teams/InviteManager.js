const {nanoid} = require("nanoid");
const config = require("../../config.json");

class InviteManager {
	constructor(teams) {
		this.teams = teams;
		this.options = config.invites;
	}

	init({database}) {
		this.collection = database.collection("invites");
	}

	async create({team, maxAge = this.options.defaultMaxAge}) {
		const token = nanoid(32);

		await this.collection.insertOne({token, team, maxAge});

		return token;
	}

	async check(token) {
		const invite = await this.collection.findOne({token});

		if(invite === null) return false;

		if((new Date().getTime() - new Date(invite.createdAt).getTime()) > invite.maxAge) {
			await this.drop(invite.token).catch(e => {throw e});

			return false;
		}

		return true;
	}

	async getTeamFromToken(token) {
		return (await this.collection.findOne({token})).team;
	}

	drop(token) {
		return this.collection.deleteOne({token});
	}
}

module.exports = InviteManager;