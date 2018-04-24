var pg = require('pg');
var fs = require('fs');
var parse = require('csv-parse/lib/sync');

var conString = "postgres://localhost/nhanes";
var inputFilename = process.argv[2];
var noPKey = process.argv[3];

pg.connect(conString, function(err, client, done) {
  if (err) {
    console.error('error fetching client from pool', err);
    process.exit(1);
  }

  var data = fs.readFileSync(inputFilename, "utf8");
  data = data.replace(/^\s*[\r\n]/gm, '');
  var rows = parse(data);

  var tableName = rows[0][0];

  var cmd = `CREATE TABLE IF NOT EXISTS ${tableName} (`;
  var columns = [];
  rows.forEach(row => {
    var cleanName = row[1].replace('\'', `\\'`);
    var column = `${cleanName} int`;
    if (row[1] == 'SEQN' && !noPKey) {
      column += ' PRIMARY KEY';
    } else {
      column += ' DEFAULT NULL';
    }

    columns.push(column);
  });
  cmd += columns.join(',\n');
  cmd += ');';

  client.query(cmd, function(err, result) {
    done();

    if(err) {
      console.error('error running query', err);
      process.exit(1);
    }

    console.log('Added table', tableName);
    process.exit(0);
  });
});
