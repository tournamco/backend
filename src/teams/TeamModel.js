class TeamModel {
	constructor({id, name, leader, members, teamSize, tournament, isPublic, key, icon}) {
		this.id = id;
		this.name = name;
		this.leader = leader;
		this.members = members;
		this.teamSize = teamSize;
		this.tournament = tournament;
		this.isPublic = isPublic;
		this.key = key;
		this.icon = icon;
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

	async toPublicObject(userManager) {
		const membersData = [];

		for(const member of this.members) {
			const user = await userManager.getModel({id: member});

			if(user == undefined) return;

			membersData.push(await user.toPublicObject());
		}

		const leader = await userManager.getModel({id: this.leader})

		if(leader == undefined) {
			console.log("NO LEADER", this.leader, this.id);
		}

		return {
			id: this.id,
			name: this.name,
			leader: leader == undefined ? undefined : await leader.toPublicObject(),
			teamSize: this.teamSize,
			isPublic: this.isPublic,
			icon: this.icon,
			tournament: this.tournament,
			members: membersData
		};
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
			key: this.key,
			icon: this.icon
		};
	}
}

module.exports = TeamModel;