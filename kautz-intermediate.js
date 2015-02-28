var fs = require('fs'),
     spawn = require('child_process').spawn,
     out = fs.openSync('./out.log', 'a'),
     err = fs.openSync('./out.log', 'a');

if (process.argv.length < 3) console.log("Not enough parameters given.")

var child = spawn('node', ['kautz-graph-overlay/kautz-node.js', process.argv[2]], {
	detached: true,
	stdio: [ 'ignore', out, err ]
});

 child.unref();