// This is a template for a Node.js scraper on morph.io (https://morph.io)

var cheerio = require("cheerio");
var request = require("request");
var sqlite3 = require("sqlite3").verbose();

function initDatabase(callback) {
	// Set up sqlite database.
	var db = new sqlite3.Database("data.sqlite");
	db.serialize(function() {
		db.run("CREATE TABLE IF NOT EXISTS habinedita (titulo TEXT,valor TEXT,url TEXT,date INT)");
		callback(db);
	});
}

function updateRow(db, titulo, valor, url) {
	// Insert some data.
	var datetime = new Date();
	var statement = db.prepare("INSERT INTO habinedita VALUES (?,?,?,?)");
	statement.run(titulo,valor,url,datetime);
	statement.finalize();
}

function readRows(db) {
	// Read some data.
	db.each("SELECT rowid AS id, titulo, valor, url, datetime(date, 'unixepoch') AS data FROM habinedita", function(err, row) {
		//console.log(row.id + ": " + row.valor + ": " + row.url + ": " + row.data);
	});
}

function fetchPage(url, callback) {
	// Use request to read in pages.
	request(url, function (error, response, body) {
		if (error) {
			console.log("Error requesting page: " + error);
			return;
		}else{
			console.log("Success: " + response);
		}

		callback(body);
	});
}

function fetchItem(db, obj_this, page) {
	var titulo = obj_this.find('span.span_imovel_titulo').text().trim();
	var valor = obj_this.find('span.lbl_preco').text().trim();
	var url = obj_this.find('a.lnk_titulo').attr('href');
	console.log(page+" "+titulo+" "+valor+" "+url);
	updateRow(db, titulo, valor, url);
}

function run(db) {
	// Use request to read in pages.
	var page=1
	var items = 0;
	var next = "/imoveis/?pg="+page+"&o=1&g=1&dd=13&cc=12&nq=2-4&p=-300000&ct=0000000000001&or=10"
	fetchPage("https://www.habinedita.com"+next, function (body) {
		// Use cheerio to find things in the page with css selectors.
		var $ = cheerio.load(body);
		lastPage = $('span.paginacao-spacer').parent().text().replace('./g', '').trim();
		if(lastPage != 'undefined'){
			console.log("lastPage: "+lastPage);
		}
		next = $('.bloco-paginacao li a').each(function () {
			var page = $(this).text().trim();
			//console.log("pagina: "+page);
			//if(page != 1){
				fetchPage("https://www.habinedita.com"+ "/imoveis/?pg="+page+"&o=1&g=1&dd=13&cc=12&nq=2-4&p=-300000&ct=0000000000001&or=10", function (body) {
					var $ = cheerio.load(body);
					next = $('a.paginacao-nav').attr('href');
					var elements = $("div.titulos").each(function () {
						var titulo = $(this).find('span.span_imovel_titulo').text().trim();
						var valor = $(this).find('span.lbl_preco').text().trim();
						var url = $(this).find('a.lnk_titulo').attr('href');
						console.log(page+" "+titulo+" "+valor+" "+url);
						updateRow(db, titulo, valor, url);
					});
				});
			//}

		});
	
		//var elements = $("div.titulos").each(fetchItem($(this)));
	});
}

initDatabase(run);
