var kautz_generator = require('./kautz-permutations.js')
var getOutNeighbours = require('./kautz-neighbours.js')
var route = require('./fission-route.js')
var net = require('net')
var async = require('async')
var fs = require('fs')
var exec = require('ssh-exec')
var spawn = require('child_process').spawn

if (process.argv.length < 6) {
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
var timeouts = []
var timedoutconnections = 0


// do it for all the identifiers at this point
for (var i = 0;i < identifiers.length; i++) {
	timeouts[i] = 0
	var host = hosts[i%hosts.length]
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


// generate a timeout function for each starter with increasing timeout so that node
// will have time to start all processes, there are many
function assignIdentifiers() {
	for (var i = 0; i < identifiers.length; i++) {
		ports[i].id = identifiers[i]
		ports[out_1[i]].id = identifiers[i]
		ports[out_2[i]].id = identifiers[i]
		setTimeout(get_starter_function(i), i*20)
	}
}


// return a function that does the actual starting of the kautz-node process.
// the function will execute the node process with the kautz-node.js and related
// parameters over ssh. For this to work properly the account must have a priv/pub
// keypair active, and the private key must be unlocked (i.e. no user intervention
// is tolerated when issuin ssh execution)
function get_starter_function(i) {
	return function() {
		var ownS = JSON.stringify(ports[i])
		var out1 = ports[out_1[i]]
		var out2 = ports[out_2[i]]
		var own = JSON.parse(ownS)
		own.out1 = out1
		own.out2 = out2

		var params = "'"+JSON.stringify(own)+"'"
		var username = process.env.USER

		var child = spawn('ssh', [host, 'node', 'kautz-graph-overlay/kautz-intermediate.js', i, params])

		child.stdout.on('data', function(data) {console.log(data.toString())})
		child.stderr.on('data', function(data) {console.log(data.toString())})

		// exec('node ~/kautz-graph-overlay/kautz-intermediate.js '+i+' '+params, username+'@'+own.host)
		// 	.on('error', function(err){
		// 		if ( err == 'Error: Timed out while waiting for handshake' && timeouts[i] < 5 ) {
		// 			timeouts[i]++
		// 			console.log("Sendoff timed out, trying again.")
		// 			setTimeout(get_starter_function(i), i*100)
		// 		} else if (err == 'Error: connect EAGAIN') {
		// 			console.log("Authentication error, trying again: "+params)
		// 			setTimeout(get_starter_function(i), i*200)
		// 		} else if ( timeouts[i] == 5 ) {
		// 			timedoutconnections++;
		// 			console.log("Sendoff failed: "+params)
		// 			ports[i].TIMEDOUT = true
		// 			console.log("Too many timeouts on: "+params )
		// 		} else {
		// 			console.log("ERROR: "+err)
		// 		}
		// 	}).pipe(process.stdout)
		// 	check_network(i)
	 }
}


// checks if we can tell something about the state of the network.
function check_network(i) {
	if (i == identifiers.length-1)
		console.log(ports, "Network is up!")

	if (timedoutconnections>0) console.log("All nodes could not be initialised! Check the host listing\
		for missing clients, you may be able to set them up manually. Count: "+timedoutconnections)
}







