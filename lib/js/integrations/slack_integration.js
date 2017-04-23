import Slack from 'slack-client';
require('events').EventEmitter;
import { slack as config } from '../../../config.json';
import Steam from '../systems/steam.js';
import User from '../user.js';
import pkg from '../../../package.json';

var SlackIntegration = (function() {
  let DEFAULT_MESSAGE = undefined;
  let VALID_COMMANDS = undefined;
  let usersToCheck = undefined;
  let NUM_USERS_ADDED = undefined;
  let MAX_USERS = undefined;
  SlackIntegration = class SlackIntegration {
    static initClass() {
      DEFAULT_MESSAGE = '#{player} is playing #{game}. Go join them!';
      VALID_COMMANDS = { ADD: 'add', ONLINE: 'online', REMOVE: 'remove' };
  
      // each slack connection needs to store the users it cares about
      usersToCheck = [];
      NUM_USERS_ADDED = 0;
      MAX_USERS = 5;
  
      module.exports = SlackIntegration;
    }

    constructor(opts){
      let channel, id;
      ({
        token: this.token
      } = opts);
      this.User = User;
      this.slack = new Slack(this.token, true, true);
      this.slack.login();
      this.slack_channels = [];
      this.steam = null;

      this.slack.on('error', err=> console.log('Slack error!', err));

      this.slack.on('open', data=> {
        console.log('Bot id:', this.slack.self.id);
        this.id = this.slack.self.id;
        this.steam = new Steam({slackTeam: this.id, slackToken: this.token});
        return this.slack_channels = ((() => {
          let result = [];
          for (id in this.slack.channels) {
            channel = this.slack.channels[id];
            if (channel.is_member) {
              result.push(channel);
            }
          }
          return result;
        })());
      });
  //      @sendMessage("I'm live! Running version #{pkg.version}", @slack_channels[0])

      this.slack.on('message', message=> {
        channel = this.slack.getChannelGroupOrDMByID(message.channel);
        let isCommand = __guard__(message != null ? message.text : undefined, x => x.indexOf(`@${this.id}`)) !== -1;
        if (!isCommand || !message || !message.text) { return; }
        return this.parseCommand(message.text, message.user, channel);
      });

      this.slack.on('close', function(data){
        console.log('Slack connection closed, waiting for reconnect', data);
        return this.slack.login();
      }); // Attempt to log back in
    }

    parseCommand(command, sendingUser, channel){
      let commandArr = command.split(' ');

      if (!this.id || (commandArr[0].indexOf(`@${this.id}`) === -1)) { return; }
      let commandAction = VALID_COMMANDS[commandArr[1] != null ? commandArr[1].toUpperCase() : undefined];
      if (!commandAction) { return this.sendMessage(`\`${commandArr[1]}\` is not a known command`, channel); }

      // ADD command
      if (commandAction === VALID_COMMANDS.ADD) {
        let newUser, system;
        if (NUM_USERS_ADDED === MAX_USERS) { return this.sendMessage(`You already have ${MAX_USERS}. Please upgrade to premium to add more :kappa:`, channel); }

        if (commandArr.length === 3) {
          system = 'steam';
          newUser = commandArr[2];
        } else {
          system = commandArr[2] != null ? commandArr[2].toLowerCase() : undefined;
          newUser = commandArr[3];
        }
      
        if (!newUser) { return this.sendMessage("Adding a user must be of format `add <system> <username>`", channel); }

        if (system === 'steam') {
          this.steam.parseUser(newUser).then(user=> {
            user.slackUser = sendingUser;
            return this.steam.saveUser(user);
        }).then(username=> {
            NUM_USERS_ADDED++;
            return this.sendMessage(`${username} has been added successfully.`, channel);
          }).catch(err=> {
            console.log('error in add user', err);
            return this.sendMessage(err, channel);
          });

        } else {
          this.sendMessage(`${system} is not a supported gaming environment`, channel);
        }

        return;
      }

      if (commandAction === VALID_COMMANDS.REMOVE) {
        let accountName = commandArr[2] != null ? commandArr[2].toLowerCase() : undefined;
        if (!accountName) { return this.sendMessage("Removing a user must be of format `remove <the_username>`", channel); }

        this.steam.removeUser(accountName).then(result=> {
          return this.sendMessage(`${result}`, channel);
      }).catch(err=> {
          console.log('error case:', err);
          return this.sendMessage(err, channel);
        });
        return;
      }

      // ONLINE command
      if (commandAction === VALID_COMMANDS.ONLINE) {
        let user;
        let users = ((() => {
          let result = [];
          for (user of Array.from(this.steam.getAllSteamUsers())) {             if (user.isPlaying()) {
              result.push(user);
            }
          }
          return result;
        })());

        if ((users != null ? users.length : undefined) > 0) {
          let onlineMessage = 'Users currently in game:';
          for (user of Array.from(users)) {
            let username = this.slack.users[user.slackUser] != null ? this.slack.users[user.slackUser].name : undefined;
            onlineMessage += `\n${username} (${user.name}) is online playing ${user.currentGame}`;
            if (user.currentSystem) { onlineMessage += ` (${user.currentSystem})`; }
          }
          this.sendMessage(onlineMessage, channel);
        } else {
          this.sendMessage('No users currently in game', channel);
        }
        return;
      }
    }

    sendMessage(message, channel){
      return channel.send(message);
    }

    sendNotification(user, game, system){
      console.log('send notification', user, game, system);
      let username = this.slack.users[user.slackUser] != null ? this.slack.users[user.slackUser].name : undefined;
      if (!username) { return; }

      let message = `@${username} (${user.name}) is playing ${game}`;
      if (system) { message += ` on ${system}`; }
      message += ". Go join them!";
      console.log('sending message to slack channels:', message);
      return Array.from(this.slack_channels).map((channel) => channel.send(message));
    }

    formatMessage(message, player, game){
      message.replace('#{player}', player);
      message.replace('#{game}', game);
      return message;
    }

    isConnected() {
      return this.slack.connected;
    }

    checkOnlineUsers() {
      return this.steam.getOnlineUsers().then(onlineUsers=> {
        return Array.from(onlineUsers).map((user) => this.sendNotification(user, user.currentGame, user.currentSystem));
      });
    }
  };
  SlackIntegration.initClass();
  return SlackIntegration;
})();

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}