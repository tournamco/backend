const fs = require("fs");
const path = require("path");
const {nanoid} = require("nanoid");
const config = require("../../config.json");
const ImageApi = require("./ImageApi");

class ImageManager {
	constructor({router, users}) {
        new ImageApi(router, users, this);
		this.options = config.images;
		this.folder = path.join(__dirname, "../../", this.options.folder);
    }

	async init({database}) {
		this.collection = database.collection("images");
		await this.ensureFolder();
	}

	async ensureFolder() {
		if(fs.existsSync(this.folder) && (await fs.promises.stat(this.folder)).isDirectory()) return;
		
		await fs.promises.mkdir(this.folder);
	}

	async create({extension, user}) {
		const id = nanoid(16);

		await this.collection.insertOne({id, extension, user, createdAt: new Date().getTime()});

		return id;
	}

	async exists(id) {
		return await this.get({id}) != null;
	}

	get(data) {
		return this.collection.findOne(data);
	}

	save(id, extension, stream) {
		return new Promise((success, reject) => {
			stream.on('end', () => success());
			stream.pipe(fs.createWriteStream(path.join(this.folder, `./${id}.${extension}`)));
		});
	}

	load(id, extension, stream) {
		fs.createReadStream(path.join(this.folder, `./${id}.${extension}`)).pipe(stream);
	}
}

module.exports = ImageManager;