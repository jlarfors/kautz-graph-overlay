
if (process.argv.length < 4) console.log("Not enough parameters given.")

var fs = require('fs'),
     spawn = require('child_process').spawn,
     out = fs.openSync('~/logs/'+process.argv[2], 'a'),
     err = fs.openSync('~/logs/'+process.argv[2], 'a');

var child = spawn('node', ['kautz-graph-overlay/kautz-node.js', process.argv[3]], {
	detached: true,
	stdio: [ 'ignore', out, err ]
});

 child.unref();