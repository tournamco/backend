const crypto = require("crypto");
const { nanoid } = require("nanoid");
const config = require("../../config.json");
const SessionManager = require("./SessionManager");
const UserModel = require("./UserModel");

class UserManager {
	constructor({database}) {
		this.collection = database.collection("users");
		this.sessions = new SessionManager(database);
	}

	/**
	 * @param {String} username 
	 * @param {String} password 
	 * @param {String} email 
	 * @param {String} gamertag 
	 */
	async create(username, password, email, gamertag) {
		const id = nanoid(16);
		const user = new UserModel({id, username, password, email, gamertag});

		await this.collection.insertOne(user.toDocument());

		return id;
	}

	hashPassword(password) {
		return crypto.createHmac("sha512", config.users.passwordSalt).update(password).digest("hex");
	}

	async checkPasswordByUsername(username, password) {
		const user = await this.collection.findOne({username});

		if(user == undefined) return false;

		return user.password == this.hashPassword(password);
	}

	async getFromSession(req) {
		const id = await this.sessions.getSessionUserId(req).catch(e=>{throw e});

		if(id === undefined) return;

		const document = await this.collection.findOne({id});

		if(document === undefined) return;

		return new UserModel(document);
	}

	async emailExists(email) {
		const documents = await this.collection.find({email});

		return documents.length > 0;
	}

	async usernameExists(username) {
		const documents = await this.collection.find({username});

		return documents.length > 0;
	}
}

module.exports = UserManager;