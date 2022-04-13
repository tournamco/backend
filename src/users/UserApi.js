const logger = require("../logging/Logger");
const ApiErrors = require("../net/server/UserApiErrors");
const JSONHTTPRequest = require("../net/server/JSONHTTPRequest");
const JSONHTTPResponse = require("../net/server/JSONHTTPResponse");
const Router = require("../net/server/Router");
const UserManager = require("./UserManager");

class UserApi {
	/**
	 * @param {UserManager} users 
	 * @param {Router} router 
	 */
	constructor(users, router) {
		this.users = users;

		router.post("/user/create", (req, res) => this.create(req, res));
		router.post("/user/login", (req, res) => this.login(req, res));
		router.post("/user/logout", (req, res) => this.logout(req, res));
		router.post("/user/change", (req, res) => this.change(req, res));
		router.post("/user/changePassword", (req, res) => this.changePassword(req, res));
		router.post("/user/me", (req, res) => this.me(req, res));
	}

	/**
	 * @param {JSONHTTPRequest} req 
	 * @param {JSONHTTPResponse} res 
	 */
	async create(req, res) {
		const data = await req.data;

		if(await this.users.getFromSession(req) !== undefined) {
			return res.send(ApiErrors.NOT_WHEN_LOGGED_IN);
		}

		if(await this.users.emailExists(data.email).catch(e => {throw e})) {
			return res.send(ApiErrors.ALREADY_USED_EMAIL);
		}

		if(await this.users.usernameExists(data.username).catch(e => {throw e})) {
			return res.send(ApiErrors.ALREADY_USED_EMAIL);
		}

		const id = await this.users.create({
			username: data.username,
			gamertag: data.gamertag,
			password: this.users.hashPassword(data.password),
			email: data.email,
			icon: data.icon
		}).catch(e => {throw e});

		logger.debug(`A user was created with id ${id} and email ${data.email}.`);

		res.send({code: 200, id}, 200);
	}

	/**
	 * @param {JSONHTTPRequest} req 
	 * @param {JSONHTTPResponse} res 
	 */
	async login(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user !== undefined) {
			return res.send(ApiErrors.NOT_WHEN_LOGGED_IN);
		}

		if(!(await this.users.checkPasswordByUsername(data.username, data.password).catch(e=>{throw e}))) {
			return res.send(ApiErrors.INCORRECT_EMAIL_PASSWORD);
		}

		const id = await this.users.getIdFromUsername(data.username).catch(e=>{throw e});
		await this.users.sessions.createSession(res, id).catch(e=>{throw e});

		logger.debug(`The user with id ${id} logged in.`);

		res.send({code: 200, id}, 200);
	}

	/**
	 * @param {JSONHTTPRequest} req 
	 * @param {JSONHTTPResponse} res 
	 */
	async logout(req, res) {
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		const token = this.users.sessions.get(req);

		this.users.sessions.clearSession(res, token);

		logger.debug(`The user with id ${user.id} logged out.`);

		res.send({code: 200}, 200);
	}

	async me(req, res) {
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		res.send({
			code: 200, 
			user: user.toPublicObject()
		}, 200);
	}

	async change(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		if(data.field == undefined || data.field == "") {
			return res.send(ApiErrors.MISSING("field"));
		}

		if(data.value == undefined || data.value == "") {
			return res.send(ApiErrors.MISSING("value"));
		}

		switch(data.field) {
			case "username":
				if(await this.users.usernameExists(data.value).catch(e=>{throw e})) {
					return res.send(ApiErrors.ALREADY_USED_USERNAME);
				}

				await this.users.changeUsername(user.id, data.value).catch(e=>{throw e});
				logger.debug(`The user with id ${user.id} changed their username to ${data.value}.`);
				break;
			case "email":
				if(await this.users.emailExists(data.value).catch(e=>{throw e})) {
					return res.send(ApiErrors.ALREADY_USED_EMAIL);
				}

				await this.users.changeEmail(user.id, data.value).catch(e=>{throw e});
				logger.debug(`The user with id ${user.id} changed their email to ${data.value}.`);
				break;
			case "gamertag":
				await this.users.changeGamertag(user.id, data.value).catch(e=>{throw e});
				logger.debug(`The user with id ${user.id} changed their gamertag to ${data.value}.`);
				break;
			case "icon":
				await this.users.changeIcon(user.id, data.value).catch(e=>{throw e});
				logger.debug(`The user with id ${user.id} changed their icon to ${data.value}.`);
				break;
			default:
				return res.send(ApiErrors.INVALID_FIELD);
		}

		res.send({code: 200}, 200);
	}

	async changePassword(req, res) {
		const data = await req.data;
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		if(data.oldPassword == undefined || data.oldPassword == "") {
			return res.send(ApiErrors.MISSING("oldPassword"));
		}

		if(data.newPassword == undefined || data.newPassword == "") {
			return res.send(ApiErrors.MISSING("newPassword"));
		}

		if(!(await this.users.checkPasswordByUsername(user.username, data.oldPassword).catch(e=>{throw e}))) {
			return res.send(ApiErrors.INCORRECT_EMAIL_PASSWORD);
		}

		await this.users.changePassword(user.id, this.users.hashPassword(data.newPassword)).catch(e=>{throw e});

		logger.debug(`The user with id ${user.id} changed their password.`);

		res.send({code: 200}, 200);
	}
}

module.exports = UserApi;