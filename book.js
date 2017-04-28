var express = require('express');
var app = express();
var mysql = require('mysql');
var Iconv = require('iconv').Iconv;
var iconv = new Iconv('UTF-8', 'EUC-KR');
var jade = require('jade');
var bodyParser = require('body-parser');

var fs = require('fs');
var cookieParser = require('cookie-parser');
var json2csv = require('json2csv');


app.set('views', './');
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());

var db = mysql.createConnection({
	host : 'localhost',
	user : 'root',
	password : 'jsjp0224',
	database : 'book_data'
	});

db.connect();


app.post('/save', (req,res)=>{
	console.log("connected")
	var jsonData = "";
	req.on('data', function (chunk) {
    	jsonData += chunk;
  	});

	req.on('end', ()=>{
		var reqq = JSON.parse(jsonData);
		
		var book = [reqq.title, reqq.link, reqq.image, reqq.author, reqq.publisher, reqq.pubdate, reqq.isbn, reqq.description, reqq.id]

		console.log(book);
		var sql = "INSERT into book (title, link, image, author, publisher, pubdate, isbn, description, id) values (?, ?, ?, ?, ?, ?, ?, ?, ?)"
		
		db.query(sql, book, (err, rows, field) =>{
		console.log(rows);
		if(err){
	       	console.log(err);
	       	res.status(500).send('Internal Server Error');
     	}
		console.log("suc")
     	res.send(reqq.title + " 등록");
	});
	});

})


app.get('/', (req,res)=>{
	res.render('login');
})




app.get('/booklist/insert', (req,res) =>{

	if(req.cookies.id) {
		res.render('insert');
	}
	else {
		res.send('cannot find id')
	}
})

app.post('/booklist/insert', (req,res) =>{
	var id = req.cookies.id;
	var title = req.body.title;
	var author  = req.body.author;
	//var pubdate = req.body.pubdate;
	var isbn = req.body.isbn;
	//var publisher = req.body.publisher;
	
	var list = [id, title, author, isbn];

	var sql = 'insert into book (id, title, author, isbn) values (?,?,?,?)';	

	db.query(sql, list, (err, rows, field)=>{
	
	if(err) {colsole.log(err)};
		res.redirect('/booklist');	
	})
})


app.post('/booklist', (req,res)=>{
	res.cookie('id', req.body.id);
	res.redirect('/booklist')
})

app.get('/booklist', (req,res)=>{
	var id = req.cookies.id;
	if(id){
	   var sql = "Select * from book where id = ?"
   	db.query(sql, id, (err, rows, field) =>{
	if(rows.length < 1) {
		res.send("can't find id")
	}
	else {
	     res.render('main',{data : rows})
      		if(err){
             	console.log(err);
             	res.status(500).send('Internal Server Error');
        	}
	}
	})

}
else{
res.send('cant find id');
}

})



app.post('/booklist/download', (req,res) =>{

	var fields = ['title', 'author', 'publisher', 'pubdate', 'isbn', 'description']
	var id = req.cookies.id;
	var sql = 'select * from book where id = ?';

	var mybook = [];
	var str = "";

	db.query(sql, id, (err,rows,field) => {

		for(var i = 0; i < rows.length; i++) {
			var title = rows[i].title + ' ';
//console.log(title);
			var author = rows[i].author + ' ';
			var publisher = rows[i].publisher + ' ';
			var pubdate = rows[i].pubdate+ ' ';
			var isbn = rows[i].isbn+ ' ';
			var description = rows[i].description + ' ';
			mybook[i] = {"title":title, "author":author, "publisher":publisher, "pubdate":pubdate, "isbn":isbn, "description":description};	
			str += title + '\t' + author + '\t' + publisher +  '\t' + pubdate +  '\t'  + isbn  + '\t' + description  + '\r\n';
	}

	console.log(mybook[0]);

	var csv = json2csv({data:mybook, fields: fields});

	var name = './' + id + '.csv';
	var name2 = './' + id + '.txt';
	csv = iconv.convert(csv);
	//fs.writeFile(name, csv, 'utf8', (err) =>{
	fs.writeFile(name, csv, (err)=>{
		console.log('download');
		if(err) {console.log(err)};

		res.download(name);

		//res.redirect('/booklist');
	})

})

})

app.get('/booklist/:no/delete', (req,res)=>{
	var num = req.params.no;
	console.log(num);
	var sql = 'delete from book where no = ?'
	db.query(sql, num, (err, rows, field)=>{
		if(err){console.log(err)}
			res.redirect('/booklist');
	})
})


app.listen("3000", ()=>{
	console.log("3000 port connected")
});
