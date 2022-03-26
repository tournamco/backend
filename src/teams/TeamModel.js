class TeamModel {
	constructor({id, name, leader, members, teamSize, tournament, isPublic, key}) {
		this.id = id;
		this.name = name;
		this.leader = leader;
		this.members = members;
		this.teamSize = teamSize;
		this.tournament = tournament;
		this.isPublic = isPublic;
		this.key = key;
	}

	addMember(id) {
		this.members.push(id);
	}

	removeMember(id) {
		this.members = this.members.filter(member => member != id);
	}

	setLeader(id) {
		this.leader = id;
	}

	toDocument() {
		return {
			id: this.id,
			name: this.name,
			leader: this.leader,
			members: this.members,
			teamSize: this.teamSize,
			tournament: this.tournament,
			isPublic: this.isPublic,
			key: this.key
		};
	}
}

module.exports = TeamModel;