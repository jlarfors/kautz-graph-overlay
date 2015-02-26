var kautz_generator = require('./kautz-permutations.js')
var getOutNeighbours = require('./kautz-neighbours.js')
var route = require('./fission-route.js')
var net = require('net')
var spawn = require('child_process').spawn
var async = require('async')
var fs = require('fs')
var exec = require('ssh-exec')

if (process.argv.length < 5) {
	// console.log("Usage: node kautz-master.js <ip> <base port> <degree> <k-length>")
	console.log("Usage: node kautz-master.js <base port> <degree> <k-length> <host1> ... <hostN>")
	process.exit(1)
}

// this version will make the entire simulation into one host starting from the given port
// one could hardcode these, but this option is given to provide a little more flexibility
// in choosing the starting points. For example one could still accept incoming connections
// from a 'non-local' ip address assignes to the given host, and one could have the node
// processes assigned port numbers from the lower ranges, although none of this is recommended
// var ip = process.argv[2]
var base_port = parseInt(process.argv[2])
var degree = parseInt(process.argv[3])
var k_length = parseInt(process.argv[4])
var hosts = process.argv.slice(5, process.argv.length)

// change these according to your preferences but remember to change the original base as well
var hash_algo = 'sha256'
var digest_type = 'hex'
var origin_base = 16

// have some other mechanism than stdio for logging on the nodes
// var out = fs.openSync('~/kautz-graph-overlay/out.log', 'a')
// var err = fs.openSync('~/kautz-graph-overlay/err.log', 'a')

// this version uses the generation of the entire kautz-space and assignment thereof
// the implementation is not valid for arbitrary k-length kautz-strings (identifiers)
var identifiers = kautz_generator(degree, k_length, hash_algo, digest_type, origin_base)
identifiers.sort()

// initialise the array for in-neighbours ( used in generating the proper routes for nodes )
var in_neighbours = []
for (var i = 0; i < identifiers.length; i++) in_neighbours[i] = 0

// generate neighbours, i.e. routes for nodes
var out_1 = []
var out_2 = []
for (var i=0; i < identifiers.length; i++ ) {
	var index = getOutNeighbours(identifiers[i], identifiers, i, in_neighbours)
	out_1[i] = index[0]
	out_2[i] = index[2]
}

// get required ports, and execute the slave nodes
var port_incrementor = 0
var ports = []

// do it for all the identifiers at this point
for (var i = 0;i < identifiers.length; i++) {
	var host = hosts[i%hosts.length]
	getPort(host, base_port+port_incrementor, saveAddress)
	port_incrementor++
}

function getPort(host, port, callback){
	// var server = net.createServer()
	// // server.ports = ports
	// server.portIndex = port_incrementor
	// port_incrementor++
	// server.on('error', function(){
	// 	callback("Port reserved")
	// })
	// server.on('listening', function() {
	// 	callback(null, this.address())
	// 	this.close()
	// })
	// server.listen(port+server.portIndex)
	var address = {host:host, port:port}
	var client = net.connect(address, function() {
		client.end()
		callback('EPORTINUSE', address)
	}).on('error', function(err) {
		callback(err, address)
	})
}

// callback to call on finding out something about the port
function saveAddress(error, address) {
	if (error.code == 'ECONNREFUSED') {
		ports.push(address)
	} else {
		getPort(address.host, address.port+port_incrementor, saveAddress)
	}
	if (ports.length == identifiers.length) assignIdentifiers()
}


// generate a timeout function for each starter with increasing timeout so that node
// will have time to start all processes, there are many
function assignIdentifiers() {
	for (var i = 0; i < identifiers.length; i++) {
		ports[i].id = identifiers[i]
		ports[out_1[i]].id = identifiers[i]
		ports[out_2[i]].id = identifiers[i]
		setTimeout(get_starter_function(i), i*10)
	}
}

// return a function that does the actual starting of the kautz-node process.
function get_starter_function(i) {
	return function() {
		var ownS = JSON.stringify(ports[i])
		var out1 = ports[out_1[i]]
		var out2 = ports[out_2[i]]
		var own = JSON.parse(ownS)
		own.out1 = out1
		own.out2 = out2

		params = JSON.stringify(own)
		var username = process.env.USER

		exec('node ~/kautz-graph-overlay/kautz-node.js '+params, username+'@'+own.host)

	 	// var child = spawn('node', ['kautz-node.js', params], {
	  //  		detached: true,
		 //    stdio: [ 'ignore', out, err ]
	 	// })
	 	// child.unref()

	 	if (i == identifiers.length-1) console.log("Network is up: \n", ports)
	}
}










