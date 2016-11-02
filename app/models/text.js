var mongoose = require('mongoose');


var TextSchema = new mongoose.Schema({
    title: String,
    slug: String,
    cover: String,
    subtitle: String,
    headline: String,
    link: String,
    data: Date,
    participantes: [String],
    place: String,
    text: String,
    stats: {
        views: Number,
        record: {
            time: Date
        }
    },
    status: {type: String, index: true, default: "rascunho"}
});

// create the model for users and expose it to app // Users var
module.exports = mongoose.model('Text', TextSchema);
