const {nanoid} = require("nanoid");
const config = require("../../config.json");
const DatabaseHandler = require("../db/DatabaseHandler");
const JSONHTTPRequest = require("../net/server/JSONHTTPRequest");
const JSONHTTPResponse = require("../net/server/JSONHTTPResponse");

class SessionManager {
	/**
	 * @param {DatabaseHandler} database
	 */
	constructor() {
		this.options = config.sessions;
	}

	init({database}) {
		this.collection = database.collection("sessions");
	}

	/**
	 * @param {JSONHTTPRequest} req 
	 * @returns {String}
	 */
	get(req) {
		return req.cookies.get(this.options.cookieName, {signed: true});
	}

	/**
	 * @param {JSONHTTPRequest} req 
	 * @returns {Promise<Number>}
	 */
	async getSessionUserId(req) {
		const token = this.get(req);

		if(token === undefined) return;

		const session = await this.collection.findOne({token}).catch(e => {throw e});

		if(session === undefined) return;

		if((new Date().getTime() - session.createdAt.getTime()) > session.maxAge) {
			return await this.dropSession(session.token).catch(e => {throw e});
		}

		return session.user;
	}

	/**
	 * @param {JSONHTTPResponse} res 
	 * @param {Number} userId 
	 * @param {Number} maxAge
	 */
	async createSession(res, userId, maxAge = this.options.defaultMaxAge) {
		const token = nanoid(32);

		await this.collection.insertOne({token, maxAge, user: userId})

		res.cookies.set(this.options.cookieName, token, {maxAge, signed: true});
	}

	/**
	 * @param {JSONHTTPResponse} res 
	 * @param {String} token 
	 */
	async clearSession(res, token) {
		res.cookies.set(this.options.cookieName, "", {signed: true});

		await this.dropSession(token).catch(e => {throw e});
	}

	/**
	 * @param {String} token 
	 * @returns {Promise<>}
	 */
	dropSession(token) {
		return this.collection.deleteOne({token});
	}
}

module.exports = SessionManager;