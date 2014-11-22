module.exports = Bot;

var Q = require('q');
var http = require('http');
var irc = require('irc');
var request = require('request');


/**
 * Bot class
 */
function Bot(config) {
  var that = this;

  that.nick = config.nick || 'zoobot';
  that.network = config.server || '127.0.0.1';
  that.channels = config.channels;
  that.buffer = {};
  that.channels.forEach(function(channel, index) {
    that.buffer[channel] = '';
  });

  that.client = new irc.Client(config.network, that.nick, {
    autoConnect: false
  });
  that.addErrorListener();
}

// Connect to the server and channels, returns a Promise
Bot.prototype.connect = function() {
  var that = this;
  return Q.Promise(function(resolve, reject) {
    that.client.connect(5, function(input) {
      that.channels.forEach(function(channel, index, channels) {
        that.client.join(channel, function(input) {
          if (index == (channels.length - 1)) {
            resolve('done');
          }
        })
      });
    })
  });
};

// Add message listener
Bot.prototype.addMessageListener = function() {
  var that = this;
  that.client.addListener('message', function (from, to, text) {
    if (from !== that.nick) {
      that.buffer[to] = text;
    }

    if (text.indexOf(that.nick) > -1) {
      if (text.indexOf('hi') > -1) {
        that.say(to, 'hello there ' + from);
      }
    }
  });
};

// Add part listener
Bot.prototype.addPartListener = function() {
  var that = this;
  that.client.addListener('part', function (channel, nick, reason, message) {
    if (nick !== that.nick) {
      that.buffer[channel] = nick + ' has left(' + reason + ')';
    }
  });
};

// Add error listener
Bot.prototype.addErrorListener = function() {
  var that = this;
  that.client.addListener('error', function(message) {
    console.log('error: ', message);
  });
};

// Send message to a channel
Bot.prototype.say = function(channel, msg) {
  var that = this;
  that.client.say(channel, msg);
};

// Part from a channel, returns a Promise
Bot.prototype.part = function(channel, msg) {
  var that = this;
  that.client.part(channel, msg);
};

// Kill the bot
Bot.prototype.kill = function() {
  var that = this;
  that.client.disconnect('killed');
};
