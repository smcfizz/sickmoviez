var express = require('express');
var session = require('express-session');
var router = express.Router();
var mongoose = require('mongoose');
mongoose.connect('mongodb://137.117.38.117:27017/movies_mongo');
var spellChecker = require('simple-spellchecker');

// Check for successfull connection
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("connected successfully");
});

var Schema = mongoose.Schema;

// Used for searching names collection
var userDataSchema = new Schema({
  name: String,
  type: String,
  id: Number
}, {collection: 'names'});

userDataSchema.index({name: 'text'});

var UserData = mongoose.model('UserData', userDataSchema);

const { Movie } = require('../schemas');
const { User } = require('../schemas');

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('home');
  res.render('index', {username: req.session.username, isSignedIn: req.session.signedIn});
});

router.get('/search', function(req, res, next) {
  console.log("search requested: " + req.query.title);

  var offset = Number(req.query.start);
  console.log('offset: ' + offset);
  const str = req.query.title;
  console.log(str);
  const autocorrect = Boolean(req.query.ac);
  console.log(autocorrect);

  if (str !== '') {
    // Make sure you unzip to .dic file
    const PATH = "./node_modules/simple-spellchecker/dict";
    // const PATH = "./public/dictionaries";
    const strings = str.split(' ');
    var results = [];
    var correctedQuery = String();
    var queryAdjusted = false;

    if (autocorrect) {
      var dict = spellChecker.getDictionarySync("en-US", PATH);
      strings.forEach(element => {
        console.log(element);
        results.push(dict.checkAndSuggest(element, 2, 2));
      });

      console.log('Results:');
      console.log(results);

      for (i = 0; i < results.length; i++) {
        if (results[i].misspelled == true && results[i].suggestions.length !== 0) {
          correctedQuery += ' ' + results[i].suggestions[0];
          queryAdjusted = true;
        } else {
          correctedQuery += ' ' + strings[i];
        }
      }

      if (correctedQuery[0] == ' ') {
        correctedQuery = correctedQuery.substr(1, correctedQuery.length - 1);
      }
    } else {
      correctedQuery = str;
    }
    console.log('correctedQuery:');
    console.log('\"' + correctedQuery + '\"');

    // Use mongoose to find data from database
    UserData.find({$text: {$search: '\"' + correctedQuery + '\"'}}).limit(10).skip(offset)
        .then(function(doc1) {
          Movie.find({$text: {$search: '\"' + correctedQuery + '\"'}}).limit(10).skip(offset)
            .then(function(doc2) {

              const previous = offset  <= 0 ? false : true;
              const next = (doc1.length < 10) && (doc2.length < 10) ? false : true;

              res.render('search',
                {title:"Search", names: doc1, collections: doc2, query: correctedQuery,
                  suggestion: str, isMistake: queryAdjusted, isSignedIn: req.session.signedIn,
                  username: req.session.username, nextOffset: offset + 10, prevOffset: offset - 10,
                  previous: previous, next: next});
            });
        }).catch(err => console.log(err));
  } else {
    // Searched nothing, prevent returning entire database
    res.redirect('/');
  }
});

// router.use((req, res, next) => {
//   req.isAdmin = true;
//   next();
// });

router.get('/about', function(req, res, next) {
  console.log("about");
  res.render('about');
});

router.get('/detail/:type/:id', function(req, res) {
  // https://expressjs.com/en/guide/routing.html#route-parameters
  console.log('search details');
  const item = {
    id: Number(req.params.id)
  }
  const type = req.params.type;
  console.log('type: ' + type);

  //Search names collection
  UserData.findOne({$and: [item, {type: req.params.type}]}).then(function(doc) {
    const title = `Details for: ${doc.name}`;
    const personId = doc.id;

    const model = Movie;
    const view = doc.type  === 'movie' ? 'movie' : 'person';

    // Search movies colletion
    if (view != 'person') {
      // is a movie. Search for movie
      return model.findOne({id: doc.id}).then(function (doc) {
        res.render(view, { title, movie: doc, isSignedIn: req.session.signedIn, username: req.session.username });
      });
    } else {
      // is a person. Search for *all* movies where a person appears
      return model.find({$or:[{'cast.id':doc.id}, {'crew.id':doc.id}]})
        .then(function (doc) {

          var profile = null;

          doc.forEach(movie => {
            if (type == 'cast'){
              movie.cast.forEach(cast=> {
                if(cast.id == personId) {
                  profile = cast.profile_path;
                }
              });
            } else {
              movie.crew.forEach(crew=>{
                if(crew.id == personId){
                  profile = crew.profile_path;
                }
              });
            }
          });
          // console.log(doc);
          res.render(view, {title, movies: doc, personId, profile, isSignedIn: req.session.signedIn, username: req.session.username});
      });
    }
  }).catch(err => console.log(err));
});

router.get('/login', function(req, res, next) {
  console.log("login");
  res.render('login', {incorrect: req.query.err});
});

router.post('/submit-login', function(req, res, next) {
  console.log(req.body.user);
  console.log(req.body.password);
  User.authenticate(req.body.user, req.body.password, function (error, user) {
    if (error || !user) {
      var err = new Error('Wrong email or password.');
      err.status = 401;
      res.redirect('/login?err=' + true);
    } else {
      req.session.userId = user._id;
      req.session.username = req.body.user;
      req.session.signedIn = true;
      return res.redirect('/');
    }
  });
  // res.redirect('/');
});

router.get('/signup', function(req, res) {
  console.log(req.session.errors);
  res.render('signup', {userExists: req.query.ue, errors: req.session.errors});
  req.session.errors = undefined;
  console.log(req.session.errors);
});

router.get('/user/:username', function(req, res, next) {
  console.log("user");
  User.findOne({username: req.session.username}).then(function (doc) {
    res.render('user', {user: doc});
  })
});

router.post('/add-user', function(req, res, next) {
  // res.render('signup');
  console.log('add-user');
  console.log(req.session.errors);
  var usr = {
    username: req.body.user,
    password: req.body.password,
    firstname: req.body.firstname,
    lastname: req.body.lastname
  };

  req.check('firstname', "First name cannot be empty.").notEmpty();
  req.check('lastname', "Last name cannot be empty.").notEmpty();
  req.check('firstname', "First name must only contain letters.").isAlpha();
  req.check('lastname', "Last name must only contain letters.").isAlpha();
  // req.check('username', "Username must only contain letters and numbers.").isAlphanumeric();
  req.check('password', 'Password needs to be at least 6 characters.').isLength({min:6});

  // var errors = req.validationErrors();
  req.session.errors = req.validationErrors();
  if (req.session.errors){
    console.log('errors:');
    // console.log(errors);
    // req.session.errors = errors;
    res.redirect('/signup');
  }
  else {
    console.log('errors:');
    User.create(usr, function(err, user) {
      if (err) {
        console.log('user already exists');
        console.log(err);
        // console.log(errors);
        // req.session.errors = errors;
        return res.redirect('/signup?ue='+ true);
      } else {
        // req.session.errors = errors;
        return res.redirect(307, '/submit-login');
      }
    });
  }
});

router.post('/add-fav', function(req, res, next){
  console.log("add-fav");
  var favorite = {
    title: req.body.title,
    id: Number(req.body.id)
  };
  console.log(req.body.title);
  console.log(req.body.id);
  console.log(req.session.username);
  // User.favorites.push(favorites);
  // User.save(done);
  // User.find({username: req.session.username}).then(function(doc){
  //   console.log('find complete');
  //   User.update({username: req.session.username}, {$push: {favorites: {title: req.body.tile, id: req.body.id}}});
  //   res.redirect('/detail/movie/' + req.body.id);
  // });
  // User.findOneAndUpdate({username: req.session.username}, {$push:{favorites: favorite}});
  User.update({username: req.session.username}, {$push: {favorites: favorite}}, function (err, raw) {
    console.log(raw);
  });
  res.redirect('/detail/movie/' + req.body.id);
  // res.redirect('/');
});


// ---------------- Additional functionality ----------------- //


router.post('/insert', function(req, res, next) {
  console.log("insert")
  var item = {
    title: req.body.title,
    content: req.body.content,
    author: req.body.author
  };
  console.log(item);

  var data = new UserData(item);
  data.save();

  res.redirect('/');
});

router.post('/update', function(req, res, next) {
  var id = req.body.id;

  UserData.findById(id, function(err, doc) {
    if (err) {
      console.error('error, no entry found');
    }
    doc.title = req.body.title;
    doc.content = req.body.content;
    doc.author = req.body.author;
    doc.save();
  })
  res.redirect('/');
});

// Not required, or desired, but functionality exists anyways
// However, remove does not fully delete from database. _id remains
router.post('/delete', function(req, res, next) {
  var id = req.body.id;
  UserData.findByIdAndRemove(id).exec();
  res.redirect('/');
});

module.exports = router;
