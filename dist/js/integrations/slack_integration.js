// Generated by CoffeeScript 1.9.3
(function() {
  var Slack, SlackIntegration, config,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Slack = require('slack-client');

  require('events').EventEmitter;

  config = require('../../../config.json');

  SlackIntegration = (function() {
    function SlackIntegration(opts) {
      this.getChannelsToNotify = bind(this.getChannelsToNotify, this);
      this.token = opts.token;
      this.slack = new Slack(this.token, true, true);
      this.slack.login();
      this.slack_channels = [];
      this.config_channels = config.channels;
      this.slack.on('error', function(err) {
        return console.log('Slack error!', err);
      });
      this.slack.on('open', (function(_this) {
        return function(data) {
          var channel, id;
          return _this.slack_channels = (function() {
            var ref, results;
            ref = this.slack.channels;
            results = [];
            for (id in ref) {
              channel = ref[id];
              if (channel.is_member) {
                results.push(channel);
              }
            }
            return results;
          }).call(_this);
        };
      })(this));
      this.slack.on('message', (function(_this) {
        return function(message) {
          var channel;
          console.log('READING MESSAGE: ', message != null ? message.text : void 0);
          channel = _this.slack.getChannelGroupOrDMByID(message.channel);
          return console.log('Channel: ', channel);
        };
      })(this));
    }

    SlackIntegration.prototype.sendNotification = function(player, game) {
      var channel, channels, i, len, message, results;
      console.log('send for channels', this.slack_channels);
      if (!this.config_channels || !this.slack_channels) {
        return;
      }
      console.log('should send');
      channels = this.getChannelsToNotify(player);
      message = player + " is playing " + game + "! Go join them!";
      results = [];
      for (i = 0, len = channels.length; i < len; i++) {
        channel = channels[i];
        results.push(channel.send(message));
      }
      return results;
    };

    SlackIntegration.prototype.getChannelsToNotify = function(player) {
      var channel, notifyChannels, userChannels;
      console.log('Getting channels to notify');
      userChannels = (function() {
        var i, len, ref, results;
        ref = this.config_channels;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          channel = ref[i];
          if (channel.indexOf(player) !== -1) {
            results.push(channel);
          }
        }
        return results;
      }).call(this);
      console.log('slack channels:', this.slack_channels.length);
      notifyChannels = (function() {
        var i, len, ref, results;
        ref = this.slack_channels;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          channel = ref[i];
          if (userChannels[channel.name] !== -1) {
            results.push(channel);
          }
        }
        return results;
      }).call(this);
      return notifyChannels;
    };

    module.exports = SlackIntegration;

    return SlackIntegration;

  })();

}).call(this);