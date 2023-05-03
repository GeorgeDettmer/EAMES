export {}; // to make it a module

declare global {
	// to access the global type String
	interface String {
		getInitials(): string;
		capitalize(): string;
	}
}

String.prototype.getInitials = function () {
	return this.replace(/[^a-zA-Z- ]/g, '')
		.match(/\b\w/g)
		?.join('');
};

String.prototype.capitalize = function () {
	return this.toLowerCase().replace(/\b\w/g, function (m) {
		return m.toUpperCase();
	});
};
