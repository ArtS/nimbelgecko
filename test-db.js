var connect = require('connect')
  , Db = require('mongodb').Db
  , Server = require('mongodb').Server
  , server_config = new Server('localhost', 27017, {auto_reconnect: true, native_parser: true})
  , db = new Db('test', server_config, {})
  , mongoStore = require('connect-mongodb');

var s = connect.createServer(
  connect.bodyParser(),
  connect.cookieParser(),
  connect.session({
    cookie: {maxAge: 60000 * 20} // 20 minutes
  , secret: 'foo'
  , store: new mongoStore({db: db})
  }),
  connect.router(function(app) {
    app.get('/', function(req, res, next) {
      res.writeHead(200, 'text/html')
      res.end('hello bro')
      next(null, {})
    })
  })
);

s.listen(8080, '10.243.6.167')
