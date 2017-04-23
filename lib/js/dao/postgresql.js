import pg from 'pg';
import Q from 'q';

var Postgresql = (function() {
  let username = undefined;
  let password = undefined;
  let url = undefined;
  let dbName = undefined;
  let connectionString = undefined;
  let client = undefined;
  let ERROR_CODES = undefined;
  Postgresql = class Postgresql {
    static initClass() {
      username = process.env.PSQL_USERNAME;
      password = process.env.PSQL_PASS;
      url = process.env.PSQL_URL;
      dbName = process.env.PSQL_DB_NAME;
      connectionString = `postgres://${username}:${password}@${url}/${dbName}`;
      client = null;
  
      ERROR_CODES = {
        '23505': 'User already exists'
      };
  
      module.exports = Postgresql;
    }

    constructor() {

      console.log('constructing psql connection', connectionString);

      client = new pg.Client(connectionString);
      client.connect();
    }

    insertUser(username, accountName, steamid, slackid, slacktoken){
      let deferred = Q.defer();
      let insertStr = `INSERT INTO sb_user(username, steamvanity, steamid, slackid, integration_fk) values('${username}', '${accountName}', '${steamid}', '${slackid}', '${slacktoken}')`;
      client.query(insertStr, (err, client, done)=> {
        if (err) {
          let errorMessage = ERROR_CODES[err.code] ? ERROR_CODES[err.code] : ' An unkown error occurred';
          return deferred.reject({error: `failed to save user: ${errorMessage}`});
        }
        return deferred.resolve({message: username + ' saved successfully'});
      });

      return deferred.promise;
    }

    getUsersForToken(botId, system){
      let deferred = Q.defer();
      let selectStr = '';
      if (system === 'steam') {
        selectStr = `SELECT * FROM sb_user WHERE steamid is not null AND integration_fk='${botId}';`;
      }
      client.query(selectStr, (err, result)=> {
        console.log('err', err);
        if (err) { return deferred.reject({error: `error fetching ${system} users`}); }
        return deferred.resolve({users: result.rows});
      });
      return deferred.promise;
    }

    deleteUser(col, id){
      let deferred = Q.defer();
      console.log('delete user from db');
      let deleteStr = `DELETE FROM ONLY sb_user WHERE ${col}='${id}';`;
      client.query(deleteStr, (err, result)=> {
        if (err) { return deferred.reject({error: `error deleting ${id} from db`}); }
        return deferred.resolve({message: `Successfully deleted ${id} from db`});
      });
      return deferred.promise;
    }

    getIntegrations() {
      let deferred = Q.defer();
      let integrationStr = "SELECT * FROM sb_integration;";
      client.query(integrationStr, (err, result)=> {
        if (err) { return deferred.reject(new Error('Error fetching integrations:')); }
        return deferred.resolve(result.rows);
      });

      return deferred.promise;
    }
  };
  Postgresql.initClass();
  return Postgresql;
})();
