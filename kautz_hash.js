var crypto = require('crypto')
var base = require('anybase')
var kautz_generator = require('./kautz-permutations.js')

// take in enough parameters
if (process.argv.length < 7) {
	console.log("Usage: <ip> <port> <length> <degree> <digit> <key-count>")
	process.exit()
} 

// set the variables needed in the generating of kautz-hashes
var ip = process.argv[2]
var port = process.argv[3]
var out_length = process.argv[4]
var k_space = process.argv[5]
var digit = parseInt(process.argv[6])
var key_count = process.argv[7]
var merge_p = 0
var hash_algo = 'sha1'
var digest_type = 'hex'
var target_base = parseInt(k_space)+1;

// generate kautz-hashes according to the pseudocode algo presented in FIFFIONE
var to_kautz_string = function(ip, port, out_length, k_space, digit, merge_p) {
	var key = ""+ip+":"+port

	// merge the 0...k-1 to the end of the key, hash it and concat it with the previous
	var intermediate = key+merge_p
	var hashed_key = crypto.createHash(hash_algo).update(intermediate).digest(digest_type)
	for (merge_p = 1; merge_p<k_space; merge_p++) {
		intermediate = key+merge_p;
		hashed_key += crypto.createHash(hash_algo).update(intermediate).digest(digest_type)
	}

	// create a kautz-string from previous buffer
	var kautz_string = ""
	while (kautz_string.length < out_length) {
		kautz_string = ""

		intermediate = key+merge_p
		hashed_key += crypto.createHash(hash_algo).update(intermediate).digest(digest_type)
		merge_p++

		// convert the hashed-key string from hexadecimal into the target base
		// there is a limit to how long the hexadecimal string can be, but it
		// should not be easily reached with this protocol (given long enough strings yes)
		kautz_string = base(target_base, hashed_key.toUpperCase(), 16)

		kautz_string = kautz_string.substring( (kautz_string.length-1-digit), (kautz_string.length-1) )

		// remove successive duplicate characters in resulting string
		var c = kautz_string[0]
		for (i=1; i<kautz_string.length;i++) {
			if (c == kautz_string[i]) {
				kautz_string = (kautz_string.slice(0, i) + kautz_string.slice(i+1, kautz_string.length))
				i--	
			}
			c = kautz_string[i]
		}
	}
	return kautz_string.substring( (kautz_string.length-1-out_length), kautz_string.length-1 )
}

// returns an array containing the out-neighbours of the given element using longest postfix-matching
// additionally counts the in-neighbours for each match, for statistics
// constrained to producing 2 in-neighbours per node with at least a single matching character
function getOutNeighbours(elem, arr, elem_index, in_neighbours) {
	var index = []
	var index_index = 0
	var cutoff = 0
	while (index.length < 4) {
		cutoff++
		if (cutoff == elem.length) return index
		var tmp_elem = elem.slice(cutoff, elem.length)
		for (var i=0; i<arr.length;i++) {
			if (i == elem_index) i++
			if (i < arr.length) {
				var comp = arr[i].slice(0, arr[i].length-cutoff)
				// if (arr[i][0] == elem[0]) continue
				if (comp == tmp_elem && in_neighbours[i]<2) {
					in_neighbours[i]++
					index[index_index] = i
					index_index++
					index[index_index] = elem.length-cutoff
					index_index++
					if (index_index==4) return index
				}
			}
		}
	}
}

// collect the kautz-hashes into this array
// var arr = []
// var ip_suffix = 0
// for (var keys = 0; keys<key_count; keys++) {
// 	arr[keys] = to_kautz_string(ip+ip_suffix, parseInt(port)+keys, out_length, k_space, digit, merge_p)
// 	if (ip_suffix%255==0) ip_suffix=0
// 	ip_suffix++
// }

var degree = 2
k_space = 10
var arr = kautz_generator(degree, k_space)
key_count = Math.pow(degree, k_space) + Math.pow(degree, k_space-1)

// get some statistics on the collisions to evaluate need for tweaks
var collision_count = 0

// sort the array for nicer representation (only needed for collision detection)
arr.sort()

for (i = 0;i<arr.length;i++) {
	if (i%3==0 || i%4==0) arr.splice(i, 1)
}

key_count = arr.length

// get an array to count in-neighbours for nodes (initialisation needed)
var in_neighbours = []
for (var i = 0; i<key_count; i++) in_neighbours[i] = 0

var cutoff_statistic = []
for (var i = 0; i<out_length;i++) cutoff_statistic[i] = 0

// get routes for each node using the predefined longest postfix matching and collect statistics
var routers1 = []
var routers2 = []
for (var i=0; i<key_count;i++) {
	if (arr[i] == arr[i+1]) collision_count++

	var index = getOutNeighbours(arr[i], arr, i, in_neighbours)
	routers1[i] = index[0]
	routers2[i] = index[2]

	cutoff_statistic[index[1]]++
	cutoff_statistic[index[3]]++
}

// output the resulting routes
var count_in = 0
var no_in_count = 0
var sinlge_in_count = 0
var no_out_count = 0
var single_out_count = 0
for (var i = 0; i<key_count; i++) {
	// console.log(in_neighbours[i]+"-> "+routers[i])
	console.log(i+": "+arr[i]+" -> "+routers1[i]+": "+arr[routers1[i]]+" "+routers2[i]+": "+arr[routers2[i]])
	count_in+=in_neighbours[i]
	if (in_neighbours[i] == 0) no_in_count++
	if (in_neighbours[i] == 1) sinlge_in_count++
	if (!routers1[i] && !routers2[i]) no_out_count++;
	if (!routers1[i] || !routers2[i]) single_out_count++;
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
console.log("Total routes (edges): "+count_in)
console.log("Total items (nodes): "+arr.length)
console.log("No routes to: "+no_in_count)
console.log("A single route to: "+sinlge_in_count)
console.log("No route out from: "+no_out_count)
console.log("A single route out from: "+single_out_count)
console.log("Collisions: "+collision_count)


// The routing algorithm that is modeled after longest postfix-prefix matching
// just for testing purposes to determine if the resulting network is viable
function route(src, dst, arr) {
	var U = arr[src]
	var W = arr[dst]
	var visited = []
	var hops = 0
	while (src != dst) {

		var cutoff = 0
		var V

		var V1
		var V2
		if (!routers1[src] && !routers2[src]) {
			visited[visited.length] = "Dead"
			return visited
		}

		function vertexExists(K, L) {
			var firstIndex = visited.indexOf(K)
			var lastIndex = visited.lastIndexOf(K)
			if (firstIndex < 0) return false
			else return ((visited[firstIndex+1] == L) || (visited[lastIndex+1] == L))
		}

		while (cutoff<U.length-1) {
			cutoff++
			if (routers1[src]) V1 = arr[routers1[src]].slice(0, U.length-cutoff)
			if (routers2[src]) V2 = arr[routers2[src]].slice(0, U.length-cutoff)
			var temp_V = W.slice(cutoff, U.length)
			if (V1 == temp_V && !vertexExists(src, routers1[src])) {
			 	V = routers1[src]
			 	break
			}
			else if (V2 == temp_V && !vertexExists(src, routers2[src])) {
				V = routers2[src]
				break
			}
		}
		
		if (V) {
			visited[visited.length] = src
			src = V
			V = null
		} else if (!vertexExists(src, routers1[src])) {
			visited[visited.length] = src
			src = routers1[src]
		} else if (!vertexExists(src, routers2[src])) {
			visited[visited.length] = src
			src = routers2[src]
		} else {
			visited[visited.length] = src
			visited[visited.length] = "Loop"
			return visited
		}

		if (visited.length > 1000) {
			visited[visited.length] = src
			visited[visited.length] = "Long"
			return visited
		}
	}
	return visited
}

// variables needed to keep track of routes and statistics
var routes_arr = []
var looped = 0
var died = 0
var completed = 0
var average = 0
var too_long = 0

// For each node, get a path from it to every other node
for (var j = 0; j<key_count;j++) {
	for (var i = 0; i<key_count;i++) {
		if (j==i) i++
		if (j >= key_count || i >= key_count) break
		var routed = route(j, i, arr)
		var route_length = routed.length
		routes_arr[i] = routed
		if (routed[route_length-1] == "Dead") died++
		else if (routed[route_length-1] == "Loop") looped++
		else if (routed[route_length-1] == "Long") too_long++
		else {completed++; average+=route_length}
	}
}
average/=completed

// output the statistics
console.log("Looped: "+looped)
console.log("Died: "+died)
console.log("Too long: "+too_long)
console.log("Completed: "+completed)
console.log("Average hops (success): "+average)