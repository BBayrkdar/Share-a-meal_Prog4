
const _moviedb = [];
const timeout = 500;
let id = 0;

module.exports = {
    /**
     * Maak een nieuwe movie aan in de database. De naam van de movie moet uniek zijn.
     * 
     * @param {*} movie de movie die we toevoegen
     * @param {*} callback De functie die oftewel een error, oftewel een resultaat teruggeeft.
     */
    createMovie(movie, callback) {
        console.log('çreateMovie called');
        // we simuleren hier dat de database query 'lang' duurt, door een setTimeout
        setTimeout(() => {
            if (movie && movie.name && _moviedb.filter((item) => item.name === movie.name).length > 0) {
                const error = 'A movie with this name already exists.'
                console.log(error);
                // roep de callback functie aan met error als resultaat, en result = undefined
                callback(error, undefined);
            } else {
                // voeg de id toe aan de movie, in de moveToAdd
                const movieToAdd = {
                    id: id++,
                    ...movie,
                    isActive: false,
                }
                _moviedb.push(movieToAdd);
                // roep de callback aan, zonder error, maar de nieuwe movie als resultaat
                callback(undefined, movieToAdd);
            }
        }, timeout);
    },

    /**
     * Retourneer een lijst van alle movies.
     * Om alle movies op te halen hebben we geen input param nodig,
     * dus alleen een callback als parameter.
     * 
     * @param {*} callback De functie die het resultaat retourneert.
     */
    listMovies(callback) {
        console.log('listMovie called');
        setTimeout(() => {
            // roep de callback aan, zonder error, maar met de hele moviedb als resultaat.
            callback(undefined, _moviedb);
        }, timeout);
    },

    getMovieById(movieId, callback) {
        setTimeout(() => {
            let filteredMovies = _moviedb.filter((item) => item.id === movieId);
            if(filteredMovies.length > 0) {
                console.log(movie);
                callback(undefined, filteredMovies[0]);
            } else {
                const error = {
                    status: 401,
                    message: `Movie with ID ${movieId} not found`,
                }
                callback(error, undefined);
            };
        }, timeout);
    },

    updateMovieById(movieId, update, callback) {
        let updatedMovie = [];
        setTimeout(() => {
            // vind movie binnen de database array
            _moviedb.forEach((item, index, array) => {
                if (item.id == movieId) {
                    // gevonden movie updaten door de meegegeven properties van het update
                    array[index] = {
                        ...array[index],
                        ...update,
                    }
                    // updated movie opslaan voor callback
                    updatedMovie.push(array[index]);
                };
            });
            if (updatedMovie.length > 0) {
                callback(undefined, updatedMovie)
            } else {
                const error = {
                    status: 404,
                    message: `Movie with ID ${movieId} not found`,
                };
                callback(error, undefined);
            };
        }, timeout);
    },

    deleteMovieById: (movieId, callback) => {
        let deletedMovie = [];
        setTimeout(() => {
            _moviedb.forEach((item, index, array) => {
                if (item.id == movieId) {
                    // verwijderde movie opslaan voor callback
                    deletedMovie.push(array[index]);
                    // gevonden movie uit de database verwijderen
                    array.splice(index, 1);
                };
            });
            if (deletedMovie.length > 0) {
                callback(undefined, deletedMovie);
            } else {
                const error = {
                    status: 404,
                    message: `Movie with ID ${movieId} deleted`,
                };
                callback(error, undefined);
            };
        }, timeout);
    },
};