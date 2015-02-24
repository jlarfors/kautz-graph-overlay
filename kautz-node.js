var net = require('net')
var fs = require('fs')

var json = JSON.parse(process.argv[2])
var own_port = json.port_own
var own_id = json.id_own
var out_1_port = json.port_1
var out_2_port = json.port_2
var out_1_id = json.out_1
var out_2_id = json.out_2

console.log(own_id, own_port, out_1_id, out_1_port, out_2_id, out_2_port)