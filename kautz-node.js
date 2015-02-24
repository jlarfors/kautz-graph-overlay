var net = require('net')

var argv = process.argv[2].split(' ')
var port = argv[1]
var out_1_id = argv[3]
var out_1_port = argv[4]
var out_2_id = argv[6]
var out_2_port = argv[7]

console.log(port, out_1_id, out_1_port, out_2_id, out_2_port)