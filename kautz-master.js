// Authors: Frans Ojala (013865821)

var kautz_generator = require('./kautz-permutations.js')
var getOutNeighbours = require('./kautz-neighbours.js')
var route = require('./fission-route.js')
var net = require('net')
var async = require('async')
var fs = require('fs')
var spawn = require('child_process').spawn

// Don't try to start with too little information, also log
if (process.argv.length < 6) {
	console.log("Usage: node kautz-master.js <base port> <degree> <k-length> <host1> ... <hostN>\n\
		where base port is in the dynamic range over 51000, degree is preferably 2 (higher orders not supported yet)\n\
		k-length should be 10, to achieve 1536 nodes, and each host must be of the form ukkoXXX. Make sure\n\
		to test that you can use the node, as sometimes a node is reserverd but still shows up as a free node.\n\
		You are advised to use at least 4 ukko nodes for this network so as to not overload an ukko node.")
	process.exit(1)
}


// This version is built to be launched on several nodes in the Ukko-cluster. The nodes
// need to be provided as the last argument in the starting of the kautz-master.
var base_port = parseInt(process.argv[2])
var degree = parseInt(process.argv[3])
var k_length = parseInt(process.argv[4])
var hosts = process.argv.slice(5, process.argv.length)


// change these according to your preferences but remember to change the origin_base as well accordingly
var hash_algo = 'sha256'
var digest_type = 'hex'
var origin_base = 16


// this version uses the generation of the entire kautz-space and assignment thereof
// the implementation is valid for arbitrary k-length kautz-strings (identifiers), but a length
// of 10 should be used.
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
// do it for all the identifiers at this point
var port_incrementor = 0
var ports = []
var domain = ".hpc.cs.helsinki.fi"
for (var i = 0;i < identifiers.length; i++) {
	var host = hosts[i%hosts.length]+domain
	getPort(host, base_port+port_incrementor, saveAddress)
	port_incrementor++
}


// try to establish a connection to a port. if no connection was made
// the callback is called with the ECONNRESUFED error and the port
// will be marked as available into the ports array. If there was
// a connection the callback is called with a generic error string
function getPort(host, port, callback){
	var address = {host:host, port:port}
	var client = net.connect(address, function() {
		client.end()
		callback('EPORTINUSE', address)
	}).on('error', function(err) {
		callback(err, address)
	})
}


// callback to call on finding out something about the port. On a
// ECONNREFUSED error mark the port as available, else try again
// on a different port.
function saveAddress(error, address) {
	if (error.code == 'ECONNREFUSED') {
		ports.push(address)
	} else {
		getPort(address.host, address.port+port_incrementor, saveAddress)
	}
	if (ports.length == identifiers.length) assignIdentifiers()
}


// have a range array for the indexes. in a limited fashion send at most
// 100 intermediates, so as not to overload the ssh daemon at an ukkonode.
var range = []
function assignIdentifiers() {
	for (var i = 0; i < identifiers.length; i++) {
		ports[i].id = identifiers[i]
		range.push(i)
	}
	async.eachLimit(range, 100, function(i, callback){
		intermediateSendoff(i, callback)
	}) 

	ports.forEach(function(item) {
		console.log(JSON.stringify(item))
	})
	console.log("Network is almost up! Connect to any node via telnet in a minute!")
}


// Build a configuration for the kautz-node that the intermediate will spawn
// Send off the intermediate process via regular ssh child process spawning
function intermediateSendoff(i, callback) {
		var ownS = JSON.stringify(ports[i])
		var out1 = ports[out_1[i]]
		var out2 = ports[out_2[i]]
		var own = JSON.parse(ownS)
		own.out1 = out1
		own.out2 = out2

		var params = "'"+JSON.stringify(own)+"'"
		var username = process.env.USER

		var child = spawn('ssh', [own.host, 'node', 'kautz-graph-overlay/kautz-intermediate.js', i, params])
		child.on('error', function(err){console.log("child error: "+i+err)})
		child.on('close', function(code, signal) { callback() })
		child.stdout.on('data', function(data){
			console.log("Child: "+" "+data.toString())
		})
		child.stderr.on('data', function(data){
			console.error(data.toString())
		})
}










