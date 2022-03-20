const DatabaseHandler = require("./db/DatabaseHandler");
const UserManager = require("./users/UserManager");
const ApiServer = require("./net/server/ApiServer");
const TournamentManager = require("./tournaments/TournamentManager");
const MatchManager = require("./matches/MatchManager");
const TeamManager = require("./teams/TeamManager");
const ImageManager = require("./images/ImageManager");
const ProofManager = require("./proofs/ProofManager");
const DisputeManager = require("./disputes/DisputeManager");

class Application {
	constructor() {
		this.db = new DatabaseHandler();
		this.apiServer = new ApiServer();
		this.users = new UserManager({router: this.apiServer.router});
		this.images = new ImageManager({router: this.apiServer.router, users: this.users});
		this.matches = new MatchManager();
		this.tournaments = new TournamentManager({matches: this.matches, users: this.users, router: this.apiServer.router});
		this.teams = new TeamManager({router: this.apiServer.router, matches: this.matches, users: this.users, tournaments: this.tournaments});
		this.proofs = new ProofManager({router: this.apiServer.router, matches: this.matches, users: this.users, teams: this.teams});
		this.disputes = new DisputeManager({router: this.apiServer.router, tournaments: this.tournaments, proofs: this.proofs, matches: this.matches});
	}

	async start() {
		await this.db.connect();
		await this.images.init({database: this.db});
		this.proofs.init({database: this.db});
		this.users.init({database: this.db});
		this.matches.init({database: this.db, proofs: this.proofs, disputes: this.disputes});
		this.tournaments.init({database: this.db, teams: this.teams});
		this.teams.init({database: this.db});
		await this.apiServer.listen();
	}

	async stop() {
		await this.apiServer.close();
		await this.db.close();
	}
}

module.exports = Application;