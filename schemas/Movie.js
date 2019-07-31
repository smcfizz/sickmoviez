const mongoose = require('mongoose');

let projectSchema = mongoose.Schema(
    {
        // _id: ObjectId(String),
        hasCredits: Number,
        production_countries: 
            [
                {
                    iso_3166_1: String,
                    name: String
                }
            ],
        revenue: Number,
        overview: String,
        video: Boolean,
        poster_path: String,
        crew:
            [
                {
                    name: String,
                    department: String,
                    job: String,
                    credit_id: String,
                    profile_path: String,
                    id: Number
                }
            ],
        id: Number,
        genres: 
            [
                {
                    id: Number,
                    name: String
                }
            ],
        title: String,
        tagline: String,
        cast:
            [
                {
                    name: String,
                    character: String,
                    credit_id: String,
                    cast_id: Number,
                    profile_path: String,
                    id: Number
                }
            ],
        vote_count: Number,
        homepage: String,
        original_language: String,
        status: String,
        spoken_languages:
            [
                {
                    iso_639_1: String,
                    name: String
                }
            ],
        imdb_id: String,
        vote_average: Number,
        adult: Boolean,
        production_companies:
            [
                {
                    name: String,
                    id: Number
                }
            ],
        release_date: String,
        popularity: Number,
        original_title: String,
        budget: Number,
        belongs_to_collection_name: String,
        belongs_to_collection_poster_path: String,
        runtime: Number
    },{collection: 'movies'}
);

projectSchema.index({title: 'text', belongs_to_collection_name: 'text'});

module.exports = mongoose.model('Movie', projectSchema);