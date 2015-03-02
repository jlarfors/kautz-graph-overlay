// Authors: Frans Ojala (013865821)

// Don't try to start with too little information
if (process.argv.length < 4) console.log("Not enough parameters given.")

var prefix = ""
var number = process.argv[2]
var fs = require('fs')
var spawn = require('child_process').spawn
var path = './kautz-logs'

try {
	var config = JSON.parse(process.argv[3])
} catch (e) {
	console.log("Error parsing configuration: "+e)
	process.exit()
}

// for nicer logfiles
if (number < 10) prefix+="000"
else if (number<100) prefix+="00"
else if (number<1000) prefix+="0"

// give the kautz-nodes a file and directory for logging.
fs.mkdir(path, function(err){
	if (err == 'EEXIST') {
		//do nothing just protection
	}
})
var out = fs.openSync(path+'/out.'+prefix+number+'.'+config.id+'.'+config.host+'.'+config.port, 'a')
var err = fs.openSync(path+'/err.'+prefix+number+'.'+config.id+'.'+config.host+'.'+config.port, 'a')

// spawn a kautz-node.js, detach it and exit.
var child = spawn('node', ['kautz-graph-overlay/kautz-node.js', process.argv[3]], {
	detached: true,
	stdio: [ 'ignore', out, err ]
})
child.unref()