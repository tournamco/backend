class Helpers {
	pageArray(array, pageNumber, pageSize) {
		const page = [];

		for(let i = pageNumber * pageSize; i < array.length && i < (pageNumber+1)*pageSize; i++) {
			page.push(array[i]);
		}

		return page;
	}
}

module.exports = new Helpers();