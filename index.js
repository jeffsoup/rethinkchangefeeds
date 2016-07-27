import Koa from 'koa.io'
import Router from 'koa-router'
import Rethink from 'rethinkdb'
import BodyParser from 'koa-body-parser'
import {rethinkdb, koa} from './config/common'

const app = Koa();
const router = new Router();
app.use(BodyParser());

var connection;

Rethink.connect( rethinkdb, function(err, conn) {
	if (err) throw err;
	connection = conn;
})

router.get('/fetch/:tablename', fetchTableData);
router.post('/insertshow', insertDocument);

app.io.route('new data', function* () {
	let message = this.args[0];
	this.broadcast.emit('new message', message);
})


//ctx.request.body.name
// ["title","directory","tvrage","TVmaze","startDate","endDate","episodesCount","runTime","network","country"]
function* insertDocument(next) {
	console.log(this.request.body)
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
	Rethink.db('test').tableCreate(this.params.tablename).run(connection, function(err, result) {
	    if (err) throw err;
	})
	this.body = 'Done'
})

router.get('/test', function *(next) {
	this.body = 'yo';
})


app
  .use(router.routes())
  .use(router.allowedMethods());

console.log('Listening on :' + koa.port);
app.listen(koa.port);
