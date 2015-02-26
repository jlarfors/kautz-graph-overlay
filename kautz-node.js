var net = require('net')
var fs = require('fs')
var outFile = fs.openSync('./out.log', 'a')
var errFile = fs.openSync('./err.log', 'a')

var config = JSON.parse(process.argv[2])

if (!config || !config.id || !config.host || !config.port || !config.out1 || !config.out2){
	logger("Incorrect call: "+process.argv[2])
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
server.on('error', function(err) {
	throw err
})
server.listen(own_port)

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

function postfix(string, k) {
	if (!string) return null
	return string.slice(k, string.length)
}

function isPrefix(X, V) {
	var prefix = V.slice(0, X.length)
	return prefix == X
}

function sendMsg(data, host, port) {
	var client = net.connect({host:host, port:port}, function() {
		client.write(JSON.stringify(data))
		client.end()
	}).on('error', function() { 
		logger("Unable to send event to "+host+":"+port+", with data: "+data)
	})
}

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

function end() {
	if (exit_status==2) {
		server.close()
		process.exit()
	}
}

function logger(err, msg) {
	if (err) fs.write(errFile, err)
	else fs.write(outFile, msg)
}



