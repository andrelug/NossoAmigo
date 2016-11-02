var mongoose = require('mongoose');


var GlossarioSchema = new mongoose.Schema({
    word: String,
	description: String,
	createdBy: String,
	relacionados: [String],
    status: String
});

// create the model for users and expose it to app // Users var
module.exports = mongoose.model('Glossario', GlossarioSchema);
