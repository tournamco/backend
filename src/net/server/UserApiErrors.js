let index = 0;

const errors = {
	/* Api errors */ 
	// When a user tries to perform an action that can only be done when logged out.
	NOT_WHEN_LOGGED_IN: {
		code: 400, 
		reason: "Bad Request", 
		message: "This action cannot be performed while logged in.",
		errno: index++
	},
	// When a user tries to perform an action that can only be done when logged in.
	NOT_LOGGED_IN: {
		code: 401, 
		reason: "Bad Request", 
		message: "This action can only be performed when logged in.",
		errno: index++
	},
	// When the given email is already in use for another account.
	ALREADY_USED_EMAIL: {
		code: 400, 
		reason: "Bad Request", 
		message: "The given email is already used for another account.",
		errno: index++
	},
	// When the given email is already in use for another account.
	ALREADY_USED_USERNAME: {
		code: 400, 
		reason: "Bad Request", 
		message: "The given username is already used for another account.",
		errno: index++
	},
	// When the email and/or password did not match
	INCORRECT_EMAIL_PASSWORD: {
		code: 400, 
		reason: "Bad Request", 
		message: "The username and/or password is incorrect.",
		errno: index++
	},
	MISSING_ERRNO: {
		errno: index++
	},
	// When the tournament name is missing
	MISSING: name => {return {
		code: 400, 
		reason: "Bad Request", 
		message: `The input ${name} was not supplied.`,
		errno: errors.MISSING_ERRNO.errno
	};},
	INCORRECT_OPTION_VALUES: {
		code: 400, 
		reason: "Bad Request", 
		message: "The given options were incorrect.",
		errno: index++
	},
	INCORRECT_TOKEN: {
		code: 400, 
		reason: "Bad Request", 
		message: "The given token is incorrect.",
		errno: index++
	},
	FULL_TEAM: {
		code: 400, 
		reason: "Bad Request", 
		message: "The team is already full.",
		errno: index++
	},
	FULL_TOURNAMENT: {
		code: 400, 
		reason: "Bad Request", 
		message: "The tournament is already full.",
		errno: index++
	},
	ALREADY_IN_TOURNAMENT: {
		code: 400, 
		reason: "Bad Request", 
		message: "The user is already in that tournament.",
		errno: index++
	},
	ALREADY_IN_TOURNAMENT_LEADER: {
		code: 400, 
		reason: "Bad Request", 
		message: "The user is already a leader in that tournament.",
		errno: index++
	},
	INCORRECT_FILE_TYPE: {
		code: 400, 
		reason: "Bad Request", 
		message: "The file is of an incorrect type.",
		errno: index++
	},
	PROOF_ALREADY_SET: {
		code: 400, 
		reason: "Bad Request", 
		message: "This proof has already been set.",
		errno: index++
	},
	INCORRECT_SCORES: {
		code: 400, 
		reason: "Bad Request", 
		message: "The given scores are incorrect.",
		errno: index++
	},
	ALREADY_USED_NAME: {
		code: 400, 
		reason: "Bad Request", 
		message: "The given name is already used for another team.",
		errno: index++
	},
	ALREADY_FINISHED: {
		code: 400, 
		reason: "Bad Request", 
		message: "That match is already finished for you.",
		errno: index++
	},
	STAGE_NOT_FOUND: {
		code: 404, 
		reason: "Not found", 
		message: "The given stage was not found.",
		errno: index++
	},
	ROUND_NOT_FOUND: {
		code: 404, 
		reason: "Not found", 
		message: "The given round was not found.",
		errno: index++
	},

	/* Basic errors */
	UNAUTHORIZED: {
		code: 401, 
		reason: "Unauthorized", 
		message: "You are not authorized to perform this action.",
		errno: index++
	},
	NOT_FOUND: {
		code: 404, 
		reason: "Not found", 
		message: "The requested api path or resource could not be found.",
		errno: index++
	},
	
	/* Server errors */
	INTERNAL_SERVER_ERROR: {
		code: 500, 
		reason: "Internal Server Error", 
		message: "There occured an unexpected error on the server.",
		errno: index++
	},

	/* More errors */
	INVALID_FIELD: {
		code: 400,
		reason: "Bad Request",
		message: "The given field is invalid.",
		errno: index++
	},
	ALREADY_PLAYING: {
		code: 400,
		reason: "Bad Request",
		message: "The team is already playing.",
		errno: index++
	},


	findByErrno: errno => {
		for(const error of errors) {
			if(typeof error === "function") continue;
			if(error.errno !== errno) continue;

			return error;
		}
	}
}

module.exports = errors;