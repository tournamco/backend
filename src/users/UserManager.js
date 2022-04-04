const crypto = require("crypto");
const { nanoid } = require("nanoid");
const config = require("../../config.json");
const SessionManager = require("./SessionManager");
const UserModel = require("./UserModel");
const UserApi = require("./UserApi");

class UserManager {
	constructor({router}) {
		this.sessions = new SessionManager();
		new UserApi(this, router);
	}

	init({database}) {
		this.collection = database.collection("users");
		this.sessions.init({database});
	}

	/**
	 * @param {String} username 
	 * @param {String} password 
	 * @param {String} email 
	 * @param {String} gamertag 
	 */
	async create({username, password, email, gamertag}) {
		const id = nanoid(16);
		const user = new UserModel({id, username, password, email, gamertag, icon: undefined});

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
		const documents = await (await this.collection.find({email})).toArray();

		return documents.length > 0;
	}

	async usernameExists(username) {
		const documents = await (await this.collection.find({username})).toArray();

		return documents.length > 0;
	}

	async changePassword(userId, password) {
		const user = await this.collection.findOne({id: userId});

		if(user == undefined) return;

		user.password = this.hashPassword(password);

		await this.collection.updateOne({id: userId}, user);
	}

	async changeUsername(userId, username) {
		const user = await this.collection.findOne({id: userId});

		if(user == undefined) return;

		user.username = username;

		await this.collection.updateOne({id: userId}, user);
	}

	async changeEmail(userId, email) {
		const user = await this.collection.findOne({id: userId});

		if(user == undefined) return;

		user.email = email;

		await this.collection.updateOne({id: userId}, user);
	}

	async changeGamertag(userId, gamertag) {
		const user = await this.collection.findOne({id: userId});

		if(user == undefined) return;

		user.gamertag = gamertag;

		await this.collection.updateOne({id: userId}, user);
	}

	async changeIcon(userId, icon) {
		const user = await this.collection.findOne({id: userId});

		if(user == undefined) return;

		user.icon = icon;

		await this.collection.updateOne({id: userId}, user);
	}

	async getIdFromUsername(username) {
		const document = await this.collection.findOne({username});

		return document.id;
	}
}

module.exports = UserManager;