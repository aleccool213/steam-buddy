import Hapi from 'hapi';
import Steambuddy from './js/steambuddy.js';

let server = new Hapi.Server();
server.connection({
  port: parseInt(process.env.PORT) || 5000
});

server.route({
  method: 'GET',
  path: '/lbstatus',
  handler(req, reply){
    return Steambuddy.status().then(function(result){
      console.log('all connected?', result);
      if (result) { reply({statusCode: 200, message: 'OK'}); }
      if (!result) { return reply({statusCode: 204, message: 'Some services not responding'}); }
    });
  }
});

server.start(err=> {
  if (err) { throw err; }
  console.log('Server is running at:', server.info.uri);
  return Steambuddy.init();
});
