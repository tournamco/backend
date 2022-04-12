const mime = require('mime-types');
const ApiErrors = require("../net/server/UserApiErrors");

class ImageApi {
	constructor(router, users, images) {
		this.images = images;
		this.users = users;
		
		router.post("/image/upload", (req, res) => this.upload(req, res));
		router.post("/image/download", (req, res) => this.download(req, res));
	}

	async upload(req, res) {
		const user = await this.users.getFromSession(req).catch(e=>{throw e});

		if(user === undefined) {
			return res.send(ApiErrors.NOT_LOGGED_IN);
		}

		const extension = mime.extension(req.header("content-type"));

		if(extension !== "jpeg" && extension !== "png") {
			return res.send(ApiErrors.INCORRECT_FILE_TYPE);
		}

		const id = await this.images.create({
			user: user.id,
			extension
		});

		await this.images.save(id, extension, req.incomingMessage);

		res.send({code: 200, id}, 200);
	}

	async download(req, res) {
		const data = await req.data;

		if(data.id == undefined) {
			return res.send(ApiErrors.MISSING("id"));
		}

		const image = await this.images.get({id: data.id});

		if(image === undefined) {
			return res.send(ApiErrors.NOT_FOUND);
		}

		res.setContentType(mime.contentType(image.extension));
		this.images.load(image.id, image.extension, res.serverResponse);
	}
}

module.exports = ImageApi;