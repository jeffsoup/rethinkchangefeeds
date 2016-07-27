import Koa from 'koa.io'
import Router from 'koa-router'
import Rethink from 'rethinkdb'
import BodyParser from 'koa-body-parser'
import Serve from 'koa-static'
import {rethinkdb, koa} from './config/common'

const app = Koa()
// const io = new IO()

const router = new Router()
app.use(BodyParser())
app.use(Serve(__dirname + '/public'))

// const io = require('socket.io').listen(app)

// io.attach( app )

var connection

Rethink.connect( rethinkdb, function(err, conn) {
	if (err) throw err;
	connection = conn;
})


Rethink.connect( rethinkdb ).then(function(conn) {
	return Rethink.table('tv_history').changes({includeTypes: true}).run(conn);
})
.then(function(cursor) {
	cursor.each(function(err, msg) {
		console.log('Updated: ' + msg.new_val.title)
		// console.log('Emitting!!!' + this.socket.client.conn)
	  app.io.sockets.emit('insert', {
	    obj: msg.new_val
	  });				
	})
})
	
router.get('/fetch/:tablename', fetchTableData);
router.post('/insertshow', insertDocument);
app.io.route('testemit', testEmit);


app.io.route('addUser', function* (next, username) {
	console.log('SERVER: Add User Event Discovered')
  // we store the username in the socket session for this client
  this.emit('login', {
    numUsers: 14
  });

  // echo globally (all clients) that a person has connected
  this.emit('user joined', {
    numUsers: 12
  });
});

// when the client emits 'new message', this listens and executes
app.io.route('new message', function* (next, message) {
  // we tell the client to execute 'new message'
  this.emit('new message', {
    username: 'Popeye',
    message: 'Welcome'
  });
});

function* testEmit(next) {
	console.log('testEmit')
	this.socket.broadcast('response', {'message': 'Dr. Watson' })
	this.body = 'Pineapple'
}

// router.get('/startchangefeed', startChangeFeed);

// app.io.route('new data', function* () {
// 	let message = this.args[0];
// 	this.broadcast.emit('new message', message);
// })

//ctx.request.body.name
// ["title","directory","tvrage","TVmaze","startDate","endDate","episodesCount","runTime","network","country"]
function* insertDocument(next) {
 	let title 		 		 = this.request.body.title
 	let directory 		 = this.request.body.directory 	
 	let tvrage 	 			 = this.request.body.tvrage
 	let TVmaze 	 			 = this.request.body.TVmaze
 	let startDate 	 	 = this.request.body.startDate
 	let endDate 			 = this.request.body.endDate
 	let numberOfEpisodes   = this.request.body.numberOfEpisodes
 	let runTime 			 = this.request.body.runTime 	 
 	let network 			 = this.request.body.network 
 	let country 			 = this.request.body.country  		 	

	let data = yield Rethink.table('tv_history').insert([
    { 
    	title: title,
    	directory: directory,
    	tvrage: tvrage,
     	TVmaze: TVmaze,
    	startDate: startDate,
    	endDate: endDate,
    	numberOfEpisodes: numberOfEpisodes,
    	runTime: runTime,
    	network: network,
    	country: country
    }]).run(connection);	
	this.body = data;
}

function* fetchTableData(next) {
	let data = yield Rethink.table( this.params.tablename).coerceTo("array").run(connection);
	this.body = data
}

router.get('/createtable/:tablename', function *(next) {
	Rethink.db('dicomTT').tableCreate(this.params.tablename).run(connection, function(err, result) {
	    if (err) throw err;
	})
	this.body = 'Done'
})

function onConnect(callback) {
  Rethink.connect( rethinkdb, function(err, connection) {
    connection['_id'] = Math.floor(Math.random()*10001);
    callback(err, connection);
  });
}

// io.on( 'join', ( ctx, data ) => {
//   console.log( 'join event fired', data )
// })


app
  .use(router.routes())
  .use(router.allowedMethods());

console.log('Listening on :' + koa.port);
app.listen(koa.port)
