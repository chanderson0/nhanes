// This file is a mess, sorry.

var pg = require('pg');
var fs = require('fs');
var parse = require('csv-parse/lib/sync');

var conString = "postgres://localhost/nhanes";
var labelFilename = process.argv[2];
var dataFilename = process.argv[3];
var fileParts = dataFilename.split('/');
var tableName = fileParts[fileParts.length-1].split('.')[0];

function createTable(cb) {
  pg.connect(conString, function(err, client, done) {
    if (err) {
      console.error('error fetching client from pool', err);
      cb(err);
    }

    var data = fs.readFileSync(labelFilename, "utf8");
    data = data.replace(/^\s*[\r\n]/gm, '');
    var rows = parse(data);

    var tableName = rows[0][0];

    var cmd = `CREATE TABLE IF NOT EXISTS ${tableName} (`;
    var columns = [];
    rows.forEach(row => {
      var cleanName = row[1].replace(/'/g, `\\'`);
      var column;
      if (row[1] == 'DRXFDCD') {
        column = `${cleanName} int NOT NULL`;
      } else {
        column = `${cleanName} varchar(255) NOT NULL`;
      }
      columns.push(column);
    });
    columns.push('parts varchar(255)[10] NOT NULL');

    cmd += columns.join(',\n');
    cmd += ');';

    client.query(cmd, function(err, result) {
      done();

      if(err) {
        console.error('error running query', err);
        cb(err);
      }

      console.log('Added table', tableName);
      cb(null);
    });
  });
}

function insertData(cb) {
  pg.connect(conString, function(err, client, done) {
    if (err) {
      console.error('error fetching client from pool', err);
      cb(err);
    }

    var data = fs.readFileSync(dataFilename);
    var rows = parse(data);

    var columns = [], points = [];
    rows.forEach(row => {
      if (columns.length == 0) {
        columns = row;
        columns.push('parts');
      } else {
        var parts = row[1].split(',').map(part => part.trim().replace(/"/g, '\\"'));
        row.push(`{"${parts.join('","')}"}`);

        points.push(`(${row[0]},'${row[1].replace(/'/g, "''")}','${row[2].replace(/'/g, "''")}','${row[3].replace(/'/g, "''")}')`);
      }
    });

    var cmd = `INSERT INTO ${tableName} (${columns.join(',')}) VALUES ${points.join(',')};`;

    console.log(cmd);

    client.query(cmd, function(err, result) {
      done();

      if(err) {
        console.error('error running query', err);
        cb(err);
      }

      console.log('Inserted to table', tableName);
      cb(null);
    });
  });
}

createTable(function(err) {
  if (err) process.exit(1);
  insertData(function(err) {
    if (err) process.exit(1);
    process.exit(0);
  });
})