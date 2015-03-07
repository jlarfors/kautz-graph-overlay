// Author: Frans Ojala (013865821)

var kautz_generator = require('./kautz-permutations.js')
var kautz_string = require('./kautz-string.js')
var getOutNeighbours = require('./kautz-neighbours.js')
var route = require('./kautz-router.js')
// var route = require('./fission-route.js')


// take in enough parameters
if (process.argv.length < 7) {
	console.log("Usage: <ip> <port> <length> <degree> <digit> <key-count>")
	process.exit()
}


// set the variables needed in the generating of kautz-hashes
var ip = process.argv[2]
var port = process.argv[3]
var out_length = parseInt(process.argv[4])
var degree = parseInt(process.argv[5])
var digit = parseInt(process.argv[6])
var key_count = parseInt(process.argv[7])
var hash_algo = 'sha1'
var digest_type = 'hex'
var origin_base = 16
var arr = []	// array for the identifiers


// use this method for individual strings or the one below for entire k-space permutations
// var ip_suffix = 0
// for (var keys = 0; keys<key_count; keys++) {
// 	arr[keys] = kautz_string(ip+ip_suffix, parseInt(port)+keys, out_length, degree, digit, hash_algo, digest_type)
// 	if (ip_suffix%255==0) ip_suffix=0
// 	ip_suffix++
// }


// use with keyspace generation
arr = kautz_generator(degree, out_length, hash_algo, digest_type, origin_base)
key_count = Math.pow(degree, out_length) + Math.pow(degree, out_length-1)


// sort the array for nicer representation (only needed for collision detection)
arr.sort()

// use with permutation generation, this is modeled to 1024 keys
for (i = 0;i<arr.length;i++) {
	if (i%3==0 || i%4==0) arr.splice(i, 1)
}

// get some statistics on the collisions to evaluate need for tweaks
var collision_count = 0

key_count = arr.length


// get an array to count in-neighbours for nodes (initialisation needed)
var in_neighbours = []
for (var i = 0; i<key_count; i++) in_neighbours[i] = 0


var cutoff_statistic = []
for (var i = 0; i<out_length;i++) cutoff_statistic[i] = 0


// get routes for each node using the predefined longest postfix matching and collect statistics
var out_neighbour_1 = []
var out_neighbour_2 = []
for (var i=0; i<key_count;i++) {
	if (arr[i] == arr[i+1]) collision_count++

	var index = getOutNeighbours(arr[i], arr, i, in_neighbours)
	out_neighbour_1[i] = index[0]
	out_neighbour_2[i] = index[2]

	cutoff_statistic[index[1]]++
	cutoff_statistic[index[3]]++
}


// output the resulting routes
var total_routes = 0
var no_in_count = 0
var sinlge_in_count = 0
var no_out_count = 0
var single_out_count = 0
for (var i = 0; i<key_count; i++) {
	// console.log(in_neighbours[i]+"-> "+routers[i])
	console.log(i+": "+arr[i]+" -> "+out_neighbour_1[i]+": "+arr[out_neighbour_1[i]]+" "+out_neighbour_2[i]+": "+arr[out_neighbour_2[i]])
	total_routes+=in_neighbours[i]
	if (in_neighbours[i] == 0) no_in_count++
	if (in_neighbours[i] == 1) sinlge_in_count++
	if (out_neighbour_1[i] == undefined && out_neighbour_2[i] == undefined) no_out_count++;
	if (out_neighbour_1[i] == undefined || out_neighbour_2[i] == undefined) single_out_count++;
}


// self explanatory
console.log("\nPrefix-postfix match variance:")
console.log("0  1  2  3  4  5  6  7   8   9   10  11  12  13 14 15 16 17 18 19")
console.log(cutoff_statistic[0]+" "+cutoff_statistic[1]+" "+cutoff_statistic[2]
	+" "+cutoff_statistic[3]+" "+cutoff_statistic[4]+" "+cutoff_statistic[5]
	+" "+cutoff_statistic[6]+" "+cutoff_statistic[7]+" "+cutoff_statistic[8]
	+" "+cutoff_statistic[9]+" "+cutoff_statistic[10]+" "+cutoff_statistic[11]
	+" "+cutoff_statistic[12]+" "+cutoff_statistic[13]+" "+cutoff_statistic[14]
	+" "+cutoff_statistic[15]+"  "+cutoff_statistic[16]+"  "+cutoff_statistic[17]
	+"  "+cutoff_statistic[18]+"  "+cutoff_statistic[19]+"\n")


// and the statistics
console.log("Collisions: "+collision_count)
console.log("Total routes (edges): "+total_routes)
console.log("Total items (nodes): "+arr.length)
console.log("No routes to: "+no_in_count)
console.log("A single route to: "+sinlge_in_count)
console.log("No route out from: "+no_out_count)
console.log("A single route out from: "+single_out_count)


// variables needed to keep track of routes and statistics
var routes_arr = []
var looped = 0
var died = 0
var completed_success = 0
var average_dead = 0
var average_success = 0
var too_long = 0
var max_path = 0
var min_path = 99


// For each node, get a path from it to every other node
for (var j = 0; j<key_count;j++) {
	for (var i = 0; i<key_count;i++) {
		if (j==i) i++
		if (j >= key_count || i >= key_count) break
		var routed = route(j, i, arr, out_neighbour_1, out_neighbour_2)
		var route_length = routed.length-1
		routes_arr[i] = routed
		if (routed[route_length] == "Dead") {died++;average_dead+=route_length}
		else if (routed[route_length] == "Loop") looped++
		else if (routed[route_length] == "Long") too_long++
		else {
			completed_success++
			average_success+=route_length
			if (max_path < route_length) max_path = route_length
			if (min_path > route_length) min_path = route_length
		}
	}
}
average_success/=completed_success
average_dead/=died


// output the statistics
console.log("Looped: "+looped)
console.log("Died: "+died)
console.log("Average hops on dead routes: "+average_dead)
console.log("Too long: "+too_long)
console.log("Completed: "+completed_success)
console.log("Average hops (success): "+average_success)
console.log("Maximum path length: "+max_path)
console.log("Minimum path length: "+min_path)