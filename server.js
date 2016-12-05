const hapi = require('hapi');
const inert = require('inert');
const querystring = require('querystring');
const env = require('env2');
const Request = require('request');
const CookieAuth = require('hapi-auth-cookie');

env('config.env');

const server = new hapi.Server();
server.connection({port: 4000});

const options = {
  password: 'm!*"2/),p4:xDs%KEgVr7;e#85Ah^WYC',
  cookie: 'cookie-name',
  isSecure: false,
  isHttpOnly: false,
  ttl: 24 * 60 * 60 * 1000
}

server.register ([inert, CookieAuth], (err) => {
  if (err) throw err;
  server.auth.strategy('base', 'cookie', options);

  server.route([{
    method: 'GET',
    path: '/',
    handler: (request, reply) => {
      reply.file('index.html');
    }
  },
  {
    method: 'GET',
    path: '/welcome',
    handler: (request, reply) => {
      var code = request.query.code;
      var obj = {client_id : process.env.CLIENT_ID, client_secret : process.env.CLIENT_SECRET, code: code};
      Request.post({url: 'https://github.com/login/oauth/access_token', form: obj}, function(err, response, body){
        request.cookieAuth.set(querystring.parse(response.body));
        reply(response.body);
      }
    )}
  },
  {
    method: 'GET',
    path: '/repos',
    config: {
      auth: {
        strategy: 'base'
      },
      handler: (request,reply) => {
        if (request.auth.isAuthenticated) {
          Request.get({
            url: 'https://api.github.com/user',
            headers: {
              'User-Agent': 'Test Oauth',
              Authorization: `token ${request.auth.credentials.access_token}`
            }
          }, (err, response, body) => {
            if(err) console.log(err);
            reply(body);
          });
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/login',
    handler: (request, reply) => {
      var url = 'https://github.com/login/oauth/authorize?'+querystring.stringify({client_id:process.env.CLIENT_ID , redirect_uri:process.env.BASE_URL});
      reply.redirect(url);
    }
  }
]);
});


server.start(err => {
  if (err) throw err;
  console.log(`server is running on ${server.info.uri}`);
});
