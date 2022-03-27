class UserModel {
	constructor({id, username, email, gamertag, password, icon}) {
		this.id = id;
		this.username = username;
		this.email = email;
		this.gamertag = gamertag;
		this.password = password;
		this.icon = icon;
	}

	toDocument() {
		return {
			id: this.id,
			username: this.username,
			email: this.email,
			gamertag: this.gamertag,
			password: this.password,
			icon: this.icon
		};
	}
}

module.exports = UserModel;