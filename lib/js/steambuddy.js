import request from 'request';
import http from 'http';
import config from '../../config.json';
import User from './user.js';
import SlackIntegration from './integrations/slack_integration.js';
import $q from 'q';
import { POSTGRESQL as psql } from './dao/DAO.js';
let db = new psql();

let { STEAM_API_TOKEN } = process.env;

let integrations = [];
let usersToCheck = [];

let init = function() {
  console.log('##### Environment variables:');
  console.log('## Slack Token:', process.env.SLACK_TOKEN);
  console.log('## Steam API Key:', process.env.STEAM_API_KEY);
  console.log('####################');
  getIntegrations().then(function(fetchedIntegrations){
    for (let integration of Array.from(fetchedIntegrations)) { integrations.push(new SlackIntegration({token: integration.id}, User)); }
    return console.log('# integrations:', integrations.length);}).catch(function(err){
    console.log('ERROR: Unable to load integrations!');
    return console.log(err);
  });

  let minutes = .1;
  let the_interval = minutes * 60 * 1000; //10 seconds
  return setInterval( (() => {
    return tickIntegrations();
  }
  ), the_interval);
};

var getIntegrations = function() {
  if (process.env.SLACK_TOKEN) { return $q.when([{id: process.env.SLACK_TOKEN}]); }

  return db.getIntegrations();
};


var tickIntegrations = () => Array.from(integrations).map((integration) => integration.checkOnlineUsers());

let status = function() {
  console.log('Checking status of connections');
  let deferred = $q.defer();
  $q.spread((Array.from(integrations).map((integration) => integration.isConnected())), function(result){
    console.log('result:', result);
    return deferred.resolve(result);
  });
  return deferred.promise;
};

export { init, status };
