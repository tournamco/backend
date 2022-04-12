const moment = require("moment");

const BREAK_LENGTH = 15;

class MatchScheduler {
	async scheduleStage(matchManager, stage) {
		const slots = this.findSlots(stage.maximalDate, stage.minimalDate, stage.maximalTime, stage.minimalTime, stage.defaultMatchLength);
		const slotsPerRound = Math.floor(slots.length / stage.rounds.length);
		
		if(slotsPerRound === 0) {
			console.log("NO SLOTS PER ROUND", stage.rounds.length, slots.length);
			return;
		}
		else {
			console.log("SLOTS PER ROUND", slotsPerRound, stage.rounds.length, slotsPerRound);
		}

		for(let i = 0; i < stage.rounds.length; i++) {
			const round = stage.rounds[i];
			const matchesPerSlot = Math.floor(round.matches.length / slotsPerRound);

			console.log("MATCHES PER SLOT", matchesPerSlot, i);

			for(let j = 0; j < slotsPerRound; j++) {
				const slot = slots[i*slotsPerRound+j];
				
				console.log("slot", slot, "index", j);
				for(let l = 0; l < matchesPerSlot; l++) {
					const match = round.matches[j*matchesPerSlot+l];
					await matchManager.updateDate(match, slot.start, slot.end);
				}
			}
		}
	}

	findSlots(maximalDate, minimalDate, maximalTime, minimalTime, defaultMatchLength) {
		const slots = [];
		const numberOfDays = maximalDate.diff(minimalDate, "days");
		for(let i = 0; i <= numberOfDays; i++) {
			let time = minimalTime.hour() * 60 + minimalTime.minutes();
			const maxTime = maximalTime.hour() * 60 + maximalTime.minutes();

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