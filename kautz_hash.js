var crypto = require('crypto')
var base = require('anybase')

// take in enough parameters
if (process.argv.length < 4) {
	console.log("Usage: <in-key> <out-length> <kautz-string-length> <low-digits-nbr>")
	process.exit()
} 

// set the variables needed in the generating of kautz-hashes
var ip = process.argv[2]
var port = process.argv[3]
var out_length = process.argv[4]
var k_space = process.argv[5]
var digit = parseInt(process.argv[6])
var merge_p = 0
var hash_algo = 'sha1'
var target_base = parseInt(k_space)+1;

// generate kautz-hashes according to the pseudocode algo presented in FIFFIONE
var to_kautz_string = function(ip, port, out_length, k_space, digit, merge_p) {
	var key = ""+ip+":"+port

	// merge the 0...k-1 to the end of the key, hash it and concat it with the previous
	var intermediate = key+merge_p
	var hashed_key = crypto.createHash(hash_algo).update(intermediate).digest()
	for (merge_p = 1; merge_p<k_space; merge_p++) {
		intermediate = key+merge_p;
		var sha1sum = crypto.createHash(hash_algo).update(intermediate)
		hashed_key = Buffer.concat([hashed_key, sha1sum.digest()])
	}

	// create a kautz-string from previous buffer
	var kautz_string = ""
	while (kautz_string.length < out_length) {
		kautz_string = ""

		intermediate = key+merge_p
		var sha1sum = crypto.createHash(hash_algo).update(intermediate)
		hashed_key = Buffer.concat([hashed_key, sha1sum.digest()])
		merge_p++

		// convert the hashed-key buffer into the target base
		for (i=0; i<hashed_key.length;i++) {
			kautz_string += base(target_base, hashed_key[i], 10)
		}

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

// Number of noes
var key_count = 1024

// collect the kautz-hashes into this array
var arr = []
var ip_suffix = 0
for (var keys = 0; keys<key_count; keys++) {
	arr[keys] = to_kautz_string(ip+ip_suffix, parseInt(port)+keys, out_length, k_space, digit, merge_p)
	if (ip_suffix%255==0) ip_suffix=0
	ip_suffix++
}

// get some statistics on the collisions to evaluate need for tweaks
var collision_count = 0

// sort the array for nicer representation (only needed for collision detection)
arr.sort()

// get an array to count in-neighbours for nodes (initialisation needed)
var in_neighbours = []
for (var i = 0; i<key_count; i++) in_neighbours[i] = 0

// get routes for each node using the predefined longest postfix matching and collect statistics
var routers = []
for (var i=0; i<key_count;i++) {
	if (arr[i] == arr[i+1]) collision_count++

	var router = arr[i] + "-> "
	var index = getOutNeighbours(arr[i], arr, i, in_neighbours)
	router+=arr[index[0]]+" ("+index[1]+"), "+arr[index[2]]+" ("+index[3]+")"
	routers[i] = router
}

// output the resulting routes
var count_in = 0
var no_in_count = 0
var sinlge_in_count = 0
for (var i = 0; i<key_count; i++) {
	console.log(in_neighbours[i]+"-> "+routers[i])
	count_in+=in_neighbours[i]
	if (in_neighbours[i] == 0) no_in_count++
	if (in_neighbours[i] == 1) sinlge_in_count++
}

// and the statistics
console.log("Total routes (edges): "+count_in)
console.log("Total items (nodes): "+routers.length)
console.log("No routes to: "+no_in_count)
console.log("A single route to: "+sinlge_in_count)
console.log("Collisions: "+collision_count)