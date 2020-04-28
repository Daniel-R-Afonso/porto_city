// This is a template for a Node.js scraper on morph.io (https://morph.io)

var cheerio = require("cheerio");
var request = require("request");
var sqlite3 = require("sqlite3").verbose();

function initDatabase(callback) {
	// Set up sqlite database.
	var db = new sqlite3.Database("data.sqlite");
	db.serialize(function() {
		db.run("CREATE TABLE IF NOT EXISTS habinedita (valor TEXT,url TEXT,date INT)");
		callback(db);
	});
}

function updateRow(db, valor, url) {
	// Insert some data.
	var datetime = new Date();
	var statement = db.prepare("INSERT INTO habinedita VALUES (?,?,?)");
	statement.run(valor,url,datetime);
	statement.finalize();
}

function readRows(db) {
	// Read some data.
	db.each("SELECT rowid AS id, valor, url, datetime(date, 'unixepoch') AS data FROM habinedita", function(err, row) {
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

function run(db) {
	// Use request to read in pages.
	var page=1
	var items = 0;
	var next = "/imoveis/?pg="+page+"&o=1&g=1&dd=13&cc=12&nq=2-4&p=-300000&ct=0000000000001&or=10"
	fetchPage("https://www.habinedita.com"+next, function (body) {
		// Use cheerio to find things in the page with css selectors.
		var $ = cheerio.load(body);
		next = $('.bloco-paginacao li a').each(function () {
			var pagina = $(this).text().trim();
			console.log("pagina: "+pagina);
			if(pagina != 1){
				fetchPage("https://www.habinedita.com"+ "/imoveis/?pg="+pagina+"&o=1&g=1&dd=13&cc=12&nq=2-4&p=-300000&ct=0000000000001&or=10", function (body) {
					var $ = cheerio.load(body);
					next = $('a.paginacao-nav').attr('href');
					var elements = $("div.titulos").each(function () {
						console.log($(this));
						//var titulo = $('span.span_imovel_titulo').text().trim();
						//var nome = $('span.lbl_preco').text().trim();
						//var url = $('a.lnk_titulo').attr('href');
						//console.log(titulo+" "+nome+" "+url);
						//items++;
						//console.log(items);
						//updateRow(db, nome, url);
					});
				});
			}

		});
	
		var elements = $(".lbl_preco").each(function () {
			var nome = $(this).text().trim();
			var url = $(this).parent().attr('href');
			items++;
			console.log(items);
			updateRow(db, nome, url);
		});
	});
}

initDatabase(run);
