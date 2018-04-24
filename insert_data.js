var pg = require('pg');
var fs = require('fs');
var parse = require('csv-parse/lib/sync');

var conString = "postgres://localhost/nhanes";
var inputFilename = process.argv[2];
var fileParts = inputFilename.split('/');
var tableName = fileParts[fileParts.length-1].split('.')[0];

pg.connect(conString, function(err, client, done) {
  if (err) {
    console.error('error fetching client from pool', err);
    process.exit(1);
  }

  var data = fs.readFileSync(inputFilename);
  var rows = parse(data);

  var columns = [], points = [];
  for (const row of rows) {
    if (columns.length == 0) {
      columns = row;
    } else {
      const rowpts = [];
      for (const pt of row) {
        if (pt == 'nan') {
          rowpts.push('null');
        } else {
          rowpts.push(pt);
        }
      }
      points.push(`(${rowpts.join(',')})`);
    }
  }

  var cmd = `INSERT INTO ${tableName} (${columns.join(',')}) VALUES ${points.join(',')};`;

  client.query(cmd, function(err, result) {
    done();

    if(err) {
      console.error('error running query', err);
      process.exit(1);
    }

    console.log('Inserted to table', tableName);
    process.exit(0);
  });
});
