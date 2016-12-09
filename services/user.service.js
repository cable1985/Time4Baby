var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(process.env.MONGODB_URI , { native_parser: true });
//var db = mongo.db(config.connectionString, {native_parser: true});
db.bind('users');

var service = {};

service.authenticate = authenticate;
service.getById = getById;
service.create = create;
service.update = update;
service.logger = logger;
service.delete = _delete;
service.remove = remove;

module.exports = service;

function authenticate(username, password) {
    var deferred = Q.defer();

    db.users.findOne({
        username: username
    }, function(err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user && bcrypt.compareSync(password, user.hash)) {
            // authentication successful
            deferred.resolve(jwt.sign({
                sub: user._id
            }, config.secret));
        } else {
            // authentication failed
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function getById(_id) {
    var deferred = Q.defer();

    db.users.findById(_id, function(err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user) {
            // return user (without hashed password)
            deferred.resolve(_.omit(user, 'hash'));
        } else {
            // user not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function create(userParam) {
    var deferred = Q.defer();

    // validation
    db.users.findOne({
            username: userParam.username
        },
        function(err, user) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            if (user) {
                // username already exists
                deferred.reject('Username "' + userParam.username + '" is already taken');
            } else {
                createUser();
            }
        });

    function createUser() {
        // set user object to userParam without the cleartext password
        var user = _.omit(userParam, 'password');
        user.nurselog = [];
        user.feedlog = [];
        user.pumplog = [];
        user.changelog = [];
        user.firstLetter;
        user.text;
        user.index;
        user.firstLetter = userParam.lastName.charAt(0);
        
        
        // add hashed password to user object
        user.hash = bcrypt.hashSync(userParam.password, 10);

        db.users.insert(
            user,
            function(err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function update(_id, userParam) {
    var deferred = Q.defer();

    // validation
    db.users.findById(_id, function(err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user.username !== userParam.username) {
            // username has changed so check if the new username is already taken
            db.users.findOne({
                    username: userParam.username
                },
                function(err, user) {
                    if (err) deferred.reject(err.name + ': ' + err.message);

                    if (user) {
                        // username already exists
                        deferred.reject('Username "' + req.body.username + '" is already taken')
                    } else {
                        updateUser();
                    }
                });
        } else {
            updateUser();
        }
    });

    function updateUser() {
        //updated first letter    
        var uFL = userParam.lastName.charAt(0);
        // fields to update
        var set = {
            firstName: userParam.firstName,
            lastName: userParam.lastName,
            username: userParam.username,
            firstLetter: uFL,
        };
        
        
        // update password if it was entered
        if (userParam.password) {
            set.hash = bcrypt.hashSync(userParam.password, 10);
        }

        db.users.update(
                {_id: mongo.helper.toObjectID(_id)}, 
                    {$set: set}, 
                        function(err, doc) {
                    if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function _delete(_id) {
    var deferred = Q.defer();

    db.users.remove({
            _id: mongo.helper.toObjectID(_id)
        },
        function(err) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}

//-------------LOGGING STUFF------------------------

/*
    The logger function is used to insert log entries into database by looking at
    the first letter of every entry and determining which log to
    place the entry into
*/
function logger(_id, userParam) {
    var deferred = Q.defer();
    var text = userParam.text;
    var dateFormat = require('dateformat');
    var now = new Date();
    now.setHours(now.getHours() - 5);
    var time = dateFormat(now, "dddd, mmmm dS, yyyy, h:MM:ss TT");
    
    //if string starts with 'C' place in changelog
    if (text.charAt(0) == 'C') {
        db.users.update({
                _id: mongo.helper.toObjectID(_id)}, 
                    {$push: {changelog: text + time}},
            function(err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });

        return deferred.promise;
    //if string starts with 'F' place in feedlog  
    } else if (text.charAt(0) == 'F') {
        db.users.update(
            {_id: mongo.helper.toObjectID(_id)},
                {$push: {feedlog: text + time}},
            function(err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });

        return deferred.promise;
    //if string starts with 'P' place in pumplog
    } else if (text.charAt(0) == 'P') {
        db.users.update(
            {_id: mongo.helper.toObjectID(_id)}, 
                {$push: {pumplog: text + time}},
            function(err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });

        return deferred.promise;
    //otherwise the entry goes into nurselog
    } else {
        db.users.update(
            {_id: mongo.helper.toObjectID(_id)}, 
                {$push: {nurselog: text + time}},
            function(err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });

        return deferred.promise;

    }
}

//removes entry
function remove(_id, userParam) {
    var deferred = Q.defer();
    var index = userParam.index;
    //if string starts with 'P' remove that index from pumplog
    if(index.charAt(0)== 'P'){
        db.users.update(
            {_id: mongo.helper.toObjectID(_id)}, 
                {$pull: {pumplog: index}},
            function(err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });

        return deferred.promise;
    //if string starts with 'C' remove that index from changelog
    }else if(index.charAt(0)== 'C'){
        db.users.update(
            {_id: mongo.helper.toObjectID(_id)}, 
                {$pull: {changelog: index}},
            function(err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                    deferred.resolve();
                });

            return deferred.promise;
    //if string starts with 'N' remove that index from nurselog    
    }else if(index.charAt(0)== 'N'){
        db.users.update({
                    _id: mongo.helper.toObjectID(_id)}, 
                            {$pull: {nurselog: index}},
                function(err, doc) {
                    if (err) deferred.reject(err.name + ': ' + err.message);

                    deferred.resolve();
                });

            return deferred.promise;
    //if sring starts with anything else remove from feedlog    
    }else{
        db.users.update({
                    _id: mongo.helper.toObjectID(_id)}, 
                            {$pull: {feedlog: index}},
                function(err, doc) {
                    if (err) deferred.reject(err.name + ': ' + err.message);

                    deferred.resolve();
                });

            return deferred.promise;
    }
}
