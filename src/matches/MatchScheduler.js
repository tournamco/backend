const moment = require("moment");

const BREAK_LENGTH = 15;

class MatchScheduler {
	async scheduleStage(matchManager, stage) {
		const slots = this.findSlots(stage.maximalDate, stage.minimalDate, stage.maximalTime, 
			stage.minimalTime, stage.defaultMatchLength);
		const slotsPerRound = Math.floor(slots.length / stage.rounds.length);
		
		if(slotsPerRound === 0) {
			return;
		}

		for(let i = 0; i < stage.rounds.length; i++) {
			const round = stage.rounds[i];
			const timeSlotsPerMatch = slotsPerRound / round.matches.length;

			for(let j = 0; j < round.matches.length; j++) {
				const match = round.matches[j];
				const slot = slots[i*slotsPerRound+Math.floor(j*timeSlotsPerMatch)];

				await matchManager.updateDate(match, slot.start, slot.end);
			}
		}
	}

	findSlots(maximalDate, minimalDate, maximalTime, minimalTime, defaultMatchLength) {
		const slots = [];
		const numberOfDays = maximalDate.diff(minimalDate, "days");
		const maxTime = maximalTime.hour() * 60 + maximalTime.minutes();

		for(let i = 0; i <= numberOfDays; i++) {
			let time = minimalTime.hour() * 60 + minimalTime.minutes();

			while(time+defaultMatchLength < maxTime) {
				const start = moment(minimalDate).add(i, "days").add(time, "minutes");
				const end = moment(start).add(defaultMatchLength, "minutes");

				time += defaultMatchLength + BREAK_LENGTH;

				slots.push({start, end});
			}
		}

		return slots;
	}
}

module.exports = MatchScheduler;