const {nanoid} = require("nanoid");
const moment = require("moment");
const StageModel = require("./StageModel");
const TournamentApi = require("./TournamentApi");
const TournamentModel = require("./TournamentModel");

class TournamentManager {
    constructor({matches, users, router}) {
        new TournamentApi(this, users, router);
        this.matches = matches;
    }

    init({database, teams}) {
        this.collection = database.collection("tournament");
        this.teams = teams;
    }

    async create({name, game, color, isPublic, organizer, stages, teamSize, gameLength, banner, online, location}) {
        const id = nanoid(16);
        const tournament = new TournamentModel({
            id, name, game, color, teamSize, isPublic, organizer: organizer.id, gameLength, teams: [], stages: [], currentStage: 0, banner, online, location: {type: "Point", coordinates: location}
        });

        for(const stageData of stages) {
            const stage = new StageModel({
                type: stageData.type,
                name: stageData.name,
                numberOfParticipants: stageData.numberOfParticipants, 
                rounds: [], 
                minimalDate: stageData.minimalDate,
                minimalTime: stageData.minimalTime,
                maximalDate: stageData.maximalDate,
                maximalTime: stageData.maximalTime,
                options: stageData.options,
                freeKeys: [],
                winners: []
            }, tournament);

            if(!stage.isValid()) return undefined;

            tournament.addStage(stage);

            stage.rounds = await stage.generateRounds(this.matches);

            await this.matches.scheduler.scheduleStage(this.matches, stage);
        }

        await this.collection.insertOne(tournament.toDocument());

        return tournament;
    }

    async matchFinished(id, match) {
        const tournament = await this.getModel({id});

        if(tournament == null) return;

        if(match.isDecided()) {
			await this.teams.updateKeys(match);
		}

        const stage = tournament.stages[tournament.currentStage];

        /*for(const teamId of match.teams) {
            const team = await this.teams.getModel({id: teamId});

            if(team == undefined) continue;
            if(!await stage.teamPlayedAllMatches(team));
            if(!await this.isWinner(team)) continue;
        }

        await this.checkIfTeamIsStageWinner(tournament, match);*/

        if(await stage.isFinished(tournament, this.matches)) {

            await this.stageFinished(tournament);
        }
    }

    checkIfTeamIsStageWinner() {
        
    }

    isWinner(team) {

    }

    async stageFinished(tournament) {
        const oldStage = tournament.stages[tournament.currentStage];
        tournament.currentStage++;

        if(tournament.currentStage === tournament.stages.length) {
            return this.tournamentFinished();
        }

        const stage = tournament.stages[tournament.currentStage];
        const winners = oldStage.getWinners();

        for(const winner of winners) {
            const key = stage.getFreeKey();
            await this.teams.setKey(winner, key);
        }
    }

    async tournamentFinished(tournament) {
        
    }

    async getFreeKey(tournamentId) {
        const tournament = await this.getModel({id: tournamentId});

        if(tournament == undefined) return;

        const key = tournament.getFreeKey();

        await this.collection.replaceOne({id: tournament.id}, tournament.toDocument());
    }

    async addTeam(id, team) {
		const tournament = await this.getModel({id});

		if(tournament.teams.length === tournament.maxParticipants) return;

		tournament.addTeam(team);

        const key = tournament.getFreeKey();

		await this.collection.replaceOne({id}, tournament.toDocument());

        return key;
	}

    async deleteById(id) {
        await this.collection.deleteOne({id});
        await this.teams.delete({id});
        await this.matches.delete({id});
    }

    getTeams(id) {
        return this.teams.getTournamentTeams(id);
    }

    get(data) {
        return this.collection.findOne(data);
    }

    async getClosest(location, radius) {
        const tournamentsData = await (await this.collection.find({location: {$near: {type: "Point", coordinates: location}, $maxDistance: radius}})).toArray();

        return tournamentsData.map(tournament => new TournamentModel(tournament));
    }

    async getOnline() {
        const tournamentsData = await (await this.collection.find({})).toArray();

        return tournamentsData.map(tournament => new TournamentModel(tournament));
    }

    async getModel(data) {
        const contents = await this.get(data);

		if(contents == undefined) return;

        return new TournamentModel(contents);
    }
}

module.exports = TournamentManager;