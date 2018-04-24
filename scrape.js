const scrapeIt = require("scrape-it");
var stringify = require('csv-stringify');

var uri = process.argv[2];

var re = new RegExp('\/([^/]*)\.htm');
var r = uri.match(re);
var filename = 'ERR'
if (r) {
  filename = r[1];
}

scrapeIt(uri, {
  vars: {
    listItem: '.pagebreak',
    data: {
      id: "dl dd:nth-child(2)",
      name: "dl dd:nth-child(4)"
    }
  }
}).then(page => {
  var rows = page.vars.map(row => [filename,row.id,row.name]);
  stringify(rows, function(err, output) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(output);
    process.exit(0);
  })
}).catch(err => {
  console.error(err);
  process.exit(1);
});
