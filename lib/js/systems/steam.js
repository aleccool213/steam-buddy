import Q from 'q';
import request from 'request';
import Parser from '../parser.js';
import User from '../user.js';
import async from 'async';
let BASE_STEAM_URL = 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=';
let FULL_PLAYER_URL = BASE_STEAM_URL + process.env.STEAM_API_KEY + '&steamids=';
let SYSTEM_NAME = 'Steam';
import { POSTGRESQL as psql } from '../dao/DAO.js';
let db = new psql();

var Steam = (function() {
  let parser = undefined;
  let onlineUsers = undefined;
  Steam = class Steam {
    static initClass() {
      parser = new Parser();
      onlineUsers = [];
  
      module.exports = Steam;
    }

    constructor(opts){
      ({
        slackTeam: this.slackTeam,
        slackToken: this.slackToken
      } = opts);

      this.usersToCheck = [];
      this.fetchUsers().then(users=> {
        return this.usersToCheck = users;
    }).catch(err=> console.log('error fetching:', err));
    }

    fetchUsers() {
      let deferred = Q.defer();
      db.getUsersForToken(this.slackToken, 'steam').then(function(userRows){
        let users = [];
        for (let user of Array.from(userRows.users)) {
          let currUser = new User({name: user.username, accountName: user.steamvanity, id: user.steamid});
          currUser.currentSystem = 'steam';
          currUser.slackUser = user.slackid;
          users.push(currUser);
        }
        return deferred.resolve(users);
      });
      return deferred.promise;
    }

    parseUser(vanityName){
      let deferred = Q.defer();
      request(`http://steamcommunity.com/id/${vanityName}/?xml=1`, (error, response, body)=> {
        if (error) { console.log('error:', error); }
        console.log('body index:', (body != null ? body.indexOf("The specified profile could not be found.") : undefined) !== -1);
        if ((body != null ? body.indexOf("The specified profile could not be found.") : undefined) !== -1) {
          return deferred.reject(`Could not find profile matching ${vanityName}`);
        }
        return parser.parse(body, function(err, result){
          console.log('err:', err);
          console.log('result:', result);
          if (!err) { return deferred.resolve(new User({name: result.name, accountName: vanityName, id: result.id, currentSystem: SYSTEM_NAME})); }
        });
      });

      return deferred.promise;
    }

    getOnlineUsers() {
      onlineUsers = [];
      let deferred = Q.defer();
      async.each(this.usersToCheck, (user, callback)=> {
        return this.isUserOnline(user).then(function(result){
          if (result && !result.error) { onlineUsers.push(result); }
          return callback();
        });
      }
      , function(err){
        if (!err) { return deferred.resolve(onlineUsers); }
      });

      return deferred.promise;
    }

    isUserOnline(user){
      let url = FULL_PLAYER_URL + user.id;
      let deferred = Q.defer();

      request(url, function(error, response, body){
        if (!error && ((response != null ? response.statusCode : undefined) === 200)) {
          let parsedResult = JSON.parse(body);
          let player = parsedResult.response.players[0];

          if (!player) { return null; }

          let game = player.gameextrainfo;
          if (game && !user.isPlaying()) {
            console.log(`setting ${user.name} to in game`);
            user.setInGame(game);
            return deferred.resolve(user);

          } else if (!game) {
            user.setInactive();
            return deferred.resolve(null);
          }
        } else {
          console.log('An error was encountered at', Date.now());
          console.log('status code:', response != null ? response.statusCode : undefined);
          console.log('url:', url);
          return deferred.reject(error);
        }
      });

      return deferred.promise;
    }

    saveUser(user){
      let deferred = Q.defer();

      db.insertUser(user.name, user.accountName, user.id, user.slackUser, this.slackToken).then(result=> {
        this.usersToCheck.push(user);
        return deferred.resolve(user.name);
    }).catch(function(err){
        console.log('failed: ', err.error);
        return deferred.reject(err.error);
      });

      return deferred.promise;
    }

    removeUser(accountName){
      let deferred = Q.defer();
      let notFoundMessage = `${accountName} not found in list of users`;
      let userToDelete = null;

      for (let user of Array.from(this.usersToCheck)) {
        if (user.accountName === accountName) {
          userToDelete = user;
          this.usersToCheck.splice(this.usersToCheck.indexOf(userToDelete), 1);
          break;
        }
      }


      if (userToDelete) {
        db.deleteUser('steamid', userToDelete.id).then(result=> deferred.resolve(`Successfully removed ${accountName} from watch list`));
      } else {
        deferred.reject(notFoundMessage);
      }
      return deferred.promise;
    }

    getAllSteamUsers() {
      return this.usersToCheck;
    }
  };
  Steam.initClass();
  return Steam;
})();
