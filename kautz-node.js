var net = require('net')
var fs = require('fs')

if (process.argv.length < 3) {
	console.log("Not enought parameters given.")
	process.exit()
}


// parse the configuration from the process arguments if possible
try {
	var config = JSON.parse(process.argv[2])
} catch (e) {
	console.error("Invalid JSON format: "+e)
	process.exit()
}


// check that we got a proper configuration, that no important pieces are missing
// does not actually check the validity of the fields.
if (!config || !config.id || !config.host || !config.port || !config.out1 || !config.out2){
	console.error("Incorrect call: "+process.argv[2])
	process.exit()
}


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
			dataString = data_in.toString('ascii', 0, data_in.length-2)

			if (dataString == 'STOP' || data_in.toString() =='STOP') {

				// NOT IN USE
				// connection.write('STOPPING')
				// if (exit_status == 0) sendExit()
			} else {
				try {
					var data = JSON.parse(data_in)
				} catch (e) { }

				if (data){
					if (data.destination == own_id) {
						console.log("Reached destination "+JSON.stringify(data))
					} else if (data.destination){
						connection.write("\nAttempting send\n")
						react(data)
						console.log("Recieved message: "+JSON.stringify(data))
						
					} else {
						connection.write("Unknown data object: "+dataString+'\n')
					}
				} else {
					connection.write("Unknown data: "+dataString+'\n')
				}
			}


	}).on('error', function(err) {
		console.error(err)
	})
})


// at this point just throw an error, this is not a very robust server.
server.on('error', function(err) {
	console.error(err)
	process.exit(1)
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
		data.path = []
		data.path.push(own_id)
		data.pathLength = -1
	} else {
		data.path.push(own_id)
	}

	var X1 = postfix(out_1_id, own_id.length-1)
	var X2 = postfix(out_2_id, own_id.length-1)

	if (X1 != null && isPrefix(data.S+X1, destination)) {
		data.L--
		data.S+=X1
		host = out_1_host
		port = out_1_port
	} else if (X2 != null && isPrefix(data.S+X2, destination)) {
		data.L--
		data.S+=X2
		host = out_2_host
		port = out_2_port
	} else {
		console.log("Destination unreachable: dead path "+JSON.stringify(data))
		// callback({code:"EUNREACHABLE", message:"Destination unreachable: dead path"})
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
		// callback("SUCCESS")
	}).on('error', function(err) {
		err.node_message = "Unable to send event to "+host+":"+port+", with data: "+JSON.stringify(data)
		console.error(err)
		// callback(err)
	})
	// client.on('data', function(msg) {
	// 	if (msg.toString() != 'SUCCESS') {
	// 		console.error("Unable to send data: "+JSON.stringify(data)+" "+msg)
	// 	}
	// 	client.end()
	// })
}

// STOPPING FUNCTION NOT IN USE
// // This tries to provide an interface to more easily enable the shutdown
// // of the entire network. It's based on the Hamiltonian path that is formed
// // inside the kautz-graph. The formality of this algorithm should be checked!
// function sendExit() {
// 	var client1 = net.connect({host:out_1_host, port:out_1_port}, function() {
// 		client1.write('STOP')
// 		client1.end()
// 		exit_status++
// 		setTimeout(end, 60000)
// 	}).on('error', function(err) {
// 		if (err.code != 'ECONNREFUSED') {
// 	 		console.log("Error stopping "+out_1_host+" "+out_1_port+" "+err)
// 		}
// 		setTimeout(end, 60000)
// 	})
// 	var client2 = net.connect({host: out_2_host, port:out_2_port}, function() {
// 		client2.write('STOP')
// 		client2.end()
// 		exit_status++
// 		setTimeout(end, 60000)
// 	}).on('error', function(err) {
// 		if (err.code != 'ECONNREFUSED') {
// 			console.log("Error stopping "+out_2_host+" "+out_2_port+" "+err)
// 		}
// 		setTimeout(end, 60000)
// 	})
// }


// // if we are able to quit after sending the exit signal to the next node.
// function end() {
// 	if (exit_status>0) {
// 		console.log('STOPPING')
// 		server.close()
// 		process.exit()
// 	}
// }






