const moment = require("moment");

const BREAK_LENGTH = 15;

class MatchScheduler {
	async scheduleStage(matchManager, stage) {
		const matchLengths = this.getMatchLengths(matchManager, stage);
		const slots = this.findSlots(stage.maximalDate, stage.minimalDate, stage.maximalTime, stage.minimalTime, stage.matchLength, stage.defaultMatchLength);

		const slotsPerRound = Math.floor(slots.length / stage.rounds.length);

		if(slotsPerRound === 0) return;

		for(let i = 0; i < stage.rounds.length; i++) {
			const round = stage.rounds[i];
			const matchesPerSlot = Math.floor(round.matches.length / slotsPerRound);

			for(let j = 0; j < slotsPerRound; j++) {
				const slot = slots[i*slotsPerRound+j];
				
				for(let l = 0; l < matchesPerSlot; l++) {
					const match = round.matches[j*matchesPerSlot+l];
					await matchManager.updateDate(match, slot.start, slot.end);
				}
			}
		}
	}

	getMatchLengths(matchManager, stage) {
		const matches = stage.rounds.reduce((acc, round) => acc.concat(round.matches), []);
		const matchLengths = [];

		for(const matchId of matches) {
			const match = matchManager.getModel({id: matchId});
			matchLengths.push(stage.getMatchLength(match));
		}

		return matchLengths;
	}

	findSlots(maximalDate, minimalDate, maximalTime, minimalTime, matchLengths, defaultMatchLength) {
		const slots = [];
		const numberOfDays = maximalDate.diff(minimalDate, "days");

		for(let i = 0; i <= numberOfDays; i++) {
			let time = minimalTime.hour() * 60 + minimalTime.minutes();
			const maxTime = maximalTime.hour() * 60 + maximalTime.minutes();
			const matchLength = matchLengths.length > 0 ? matchLengths.pop() : defaultMatchLength;

			while(time+matchLength < maxTime) {
				const start = moment(minimalDate).add(i, "days").add(time, "minutes");
				const end = moment(start).add(matchLength, "minutes");
				time += matchLength + BREAK_LENGTH;
				slots.push({start, end});
			}
		}

		return slots;
	}
}

module.exports = MatchScheduler;