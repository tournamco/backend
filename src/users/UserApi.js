const logger = require("../logging/Logger");
const ApiErrors = require("../net/server/UserApiErrors");
const JSONHTTPRequest = require("../net/user/JSONHTTPRequest");
const JSONHTTPResponse = require("../net/user/JSONHTTPResponse");
const Router = require("../net/user/Router");
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
	}

	/**
	 * @param {JSONHTTPRequest} req 
	 * @param {JSONHTTPResponse} res 
	 */
	async create(req, res) {
		const data = await req.data;

		if(this.users.getFromSession(req) !== undefined) {
			return res.send(ApiErrors.NOT_WHEN_LOGGED_IN);
		}

		if(!new RegExp(this.users.options.passwordRegex).test(data.password)) {
			return res.send(ApiErrors.INVALID_PASSWORD);
		}

		if(!new RegExp(this.users.options.emailRegex).test(data.email)) {
			return res.send(ApiErrors.INVALID_EMAIL);
		}

		if(await this.users.emailExists(data.email).catch(e => {throw e})) {
			return res.send(ApiErrors.ALREADY_USED_EMAIL);
		}

		const id = await this.users.create({
			firstname: xss(data.firstname),
			lastname: xss(data.lastname),
			password: this.users.hashPassword(data.password),
			email: xss(data.email)
		}).catch(e => {throw e});

		logger.debug(`A user was created with id ${id} and email ${email}.`);

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

		if(!(await this.users.checkPasswordByEmail(data.email, data.password).catch(e=>{throw e}))) {
			return res.send(ApiErrors.INCORRECT_EMAIL_PASSWORD);
		}

		const id = await this.users.getIdFromEmail(data.email).catch(e=>{throw e});
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
}

module.exports = UserApi;