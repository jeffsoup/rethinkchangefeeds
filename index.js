import Koa from 'koa'
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


//ctx.request.body.name
function* insertDocument(next) {
 	let name 		 = this.request.body.name
 	let show 		 = this.request.body.show 	
 	let title1 	 = this.request.body.title1
 	let title2 	 = this.request.body.title2
 	let title3 	 = this.request.body.title3
 	let content1 = this.request.body.content1
 	let content2 = this.request.body.content2
 	let content3 = this.request.body.content3 	 

	let data = yield Rethink.table('tv_history').insert([
    { name: name, tv_show: show,
      posts: [
        {title: title1, content: content1},
        {title: title2, content: content2},
        {title: title3, content: content3}
      ]
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
