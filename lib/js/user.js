import Postgresql from './db/postgresql.js';
let db = new Postgresql();

class User {
  static initClass() {


    module.exports = User;
  }
  constructor(opts){
    ({
      name: this.name, //username
      accountName: this.accountName, //login name for steam account
      id: this.id, //steamId
      currentSystem: this.currentSystem
    } = opts);

    this.onlineUsers = [];
    this.slackUser = null; //slackId

    this.inGame = false;
    this.currentGame = null;
  }


  isPlaying() {
    return this.inGame;
  }

  setInGame(gameName){
    this.inGame = true;
    this.currentGame = gameName;
    this.onlineUsers.push(this);
    return console.log('pushed to online users', this.onlineUsers);
  }

  setInactive() {
    if (this.onlineUsers.indexOf(this) === -1) { return; }

    this.inGame = false;
    this.currentGame = null;

    return this.onlineUsers.splice(this.onlineUsers.indexOf(this), 1);
  }

  static getOnlineUsers() {
    console.log('instance users', this.onlineUsers);
    return this.onlineUsers;
  }

  static removeUser(username){
    return db.deleteUser(username);
  }
}
User.initClass();
