var mongoose = require('mongoose');


var PlaceSchema = new mongoose.Schema({
    place: String,
	owner: String,
    status: {type: String, index: true, default: "rascunho"}
});

// create the model for users and expose it to app // Users var
module.exports = mongoose.model('Place', PlaceSchema);
