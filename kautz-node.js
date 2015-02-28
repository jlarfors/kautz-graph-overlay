var net = require('net')
var fs = require('fs')
var outFile = fs.open('./out.log', 'a')
var errFile = fs.open('./err.log', 'a')

if (process.argv.length < 3) {
	logger("Not enought parameters given.")
	process.exit()
}


// parse the configuration from the process arguments if possible
try {
	var config = JSON.parse(process.argv[2])
} catch (e) {
	logger("Invalid JSON format: "+e)
	process.exit()
}


// check that we got a proper configuration, that no important pieces are missing
// does not actually check the validity of the fields.
if (!config || !config.id || !config.host || !config.port || !config.out1 || !config.out2){
	logger("Incorrect call: "+process.argv[2])
	process.exit()
}

logger(null, JSON.stringify(config))
process.exit()

var own_id = config.id
var own_host = config.host
var own_port = config.port

var out_1_id = config.out1.id
var out_1_host = config.out1.host
var out_1_port = config.out1.port

var out_2_id = config.out2.id
var out_2_host = config.out2.host
var out_2_port = config.out2.port

var exit_status = 0


// create the listening server to accept incoming connections from other nodes
// try to protect against other processes communicating with the node.
var server = net.createServer(function(connection) {
	connection.on('data', function(data_in) {
		if (data_in.toString('ascii', 0, data_in.length-2) == 'STOP') sendExit()
		var data = JSON.parse(data_in)
		if (data == undefined) logger("Erroneous data: "+data_in)
		else if (data.destination == own_id) {
			logger(null, "Reached destination "+data)
		} else {
			react(data)
		}
	})
})


// at this point just throw an error, this is not a very robust server.
server.on('error', function(err) {
	throw err
})
server.listen(own_port)


// react to some incoming data. mainly provide the actual routing for the message.
function react(data) {
	var destination = data.destination
	var port
	var host

	if (!data.L || !data.S) {
		if (own_id[own_id.length-1] == data.destination[0]) {
			data.S = data.destination[0]
			data.L = own_id.length-1
		} else {
			data.S = ""
			data.L = own_id.length
		}
		data.source = own_id
		data.pathLength = -1
	}
	var X1 = postfix(out_1_id, own_id.length-1)
	var X2 = postfix(out_2_id, own_id.length-1)

	if (X1 != null && isPrefix(S+X1, destination)) {
		data.L--
		data.S+=X1
		host = out_1_host
		port = out_1_port
	} else if (X2 != null && isPrefix(S+X2, destination)) {
		data.L--
		data.S+=X2
		host = out_2_host
		port = out_2_port
	} else {
		logger(null, "Destination unreachable: dead path "+data)
		return
	}
	data.pathLength++
	sendMsg(data, host, port)
}


// grab the postfix that is associated with the particular string.
function postfix(string, k) {
	if (!string) return null
	return string.slice(k, string.length)
}


// check if the given postfix string is actually a prefix of the node
// routing to.
function isPrefix(X, V) {
	var prefix = V.slice(0, X.length)
	return prefix == X
}


// Send some data over to the next node that was chosen by the routing algorithm
function sendMsg(data, host, port) {
	var client = net.connect({host:host, port:port}, function() {
		client.write(JSON.stringify(data))
		client.end()
	}).on('error', function() { 
		logger("Unable to send event to "+host+":"+port+", with data: "+data)
	})
}


// This tries to provide an interface to more easily enable the shutdown
// of the entire network. It's based on the Hamiltonian path that is formed
// inside the kautz-graph. The formality of this algorithm should be checked!
function sendExit() {
	var client1 = net.connect({host:out_1_host, port:out_1_port}, function() {
		client.write('End')
		client.end()
		exit_status++
		setTimeout(end, 5000)
	}).on('error', function() {
		logger(null, "Unable to end session on "+out_1_host+""+err)
	})
	var client2 = net.connect({host: out_2_host, port:out_2_port}, function() {
		client.write('End')
		client.end()
		exit_status++
		setTimeout(end, 5000)
	}).on('error', function() {
		logger(null, "Unable to end session on "+out_2_host+""+err)
	})
}


// if we are able to quit after sending the exit signal to the next node.
function end() {
	if (exit_status==2) {
		server.close()
		process.exit()
	}
}


// a function to provide logging to an outise file, as no commangin terminal
// will be attached to this process in the listening mode.
function logger(err, msg) {
	if (err) fs.write(errFile, err+'\n')
	else fs.write(outFile, msg+'\n')
}



