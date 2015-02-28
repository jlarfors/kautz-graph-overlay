
if (process.argv.length < 4) console.log("Not enough parameters given.")

console.log(process.argv[2])

var prefix = ""
var number = process.argv[2]

if (number < 10) prefix+="000"
else if (number<100) prefix+="00"
else if (number<1000) prefix+="0"

var fs = require('fs'),
     spawn = require('child_process').spawn,
     out = fs.openSync('./logs/'+prefix+number+'.out', 'a'),
     err = fs.openSync('./logs/'+prefix+number+'.err', 'a');

var child = spawn('node', ['kautz-graph-overlay/kautz-node.js', process.argv[3]], {
	detached: true,
	stdio: [ 'ignore', out, err ]
})

 child.unref()