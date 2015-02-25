var net = require('net')
var fs = require('fs')

var json = JSON.parse(process.argv[2])
var own_port = json.port_own
var own_id = json.id_own
var out_1_port = json.port_1
var out_2_port = json.port_2
var out_1_id = json.out_1
var out_2_id = json.out_2

var server = net.createServer(function(connection) {
	connection.on('data', function(data_in) {
		if (data_in.toString('ascii', 0, data_in.length-2) == 'STOP') process.exit(0)
		var data = JSON.parse(data_in)
		if (data == undefined) console.error("Erroneous data: "+data_in)
		else if (data.destination == own_id) {
			console.log("Reached destination")
		} else {
			react(data)
		}
	})
})
server.on('error', function(err) {
	throw err
})
server.listen(own_port)

function react(data) {
	var destination = data.destination
	var L = data.L
	var S = data.S
	var port

	if (!data.L || !data.S) {
		if (own_id[own_id.length-1] == data.destination[0]) {
			data.S = data.destination[0]
			data.L = own_id.length-1
		} else {
			data.S = ""
			data.L = own_id.length
		}
	}
	var X1 = postfix(out_1_id, own_id.length-1)
	var X2 = postfix(out_2_id, own_id.length-1)

	if (X1 != null && isPrefix(S+X1, destination)) {
		data.L--
		data.S+=X1
		port = out_1_port
	} else if (X2 != null && isPrefix(S+X2, destination)) {
		data.L--
		data.S+=X2
		port = out_2_port
	} else {
		console.log("Destination unreachable: dead path")
		return
	}
	sendMsg(data, port)
}

 function postfix(string, k) {
 	if (!string) return null
 	return string.slice(k, string.length)
 }

 function isPrefix(X, V) {
 	var prefix = V.slice(0, X.length)
 	return prefix == X
 }

 function sendMsg(data, port) {
 	var client = net.connect({port:port}, function() {
 		client.write(JSON.stringify(data))
 		client.end()
 	}).on('error', function() { 
 		console.error("Unable to send event to "+port+", with data: "+data)
 	})
 }


