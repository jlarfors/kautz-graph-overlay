var crypto = require('crypto')
var base = require('anybase')

if (process.argv.length < 4) {
	console.log("Usage: <in-key> <out-length> <kautz-string-length> <low-digits-nbr>")
	process.exit()
} 

var ip = process.argv[2]
var port = process.argv[3]
var out_length = process.argv[4]
var k_space = process.argv[5]
var digit = parseInt(process.argv[6])
var merge_p = 0
var hash_algo = 'sha1'
var target_base = parseInt(k_space)+1;

var to_kautz_string = function(ip, port, out_length, k_space, digit, merge_p) {
	var key = ""+ip+":"+port

	var intermediate = key+merge_p
	var hashed_key = crypto.createHash(hash_algo).update(intermediate).digest()

	for (merge_p = 1; merge_p<k_space; merge_p++) {
		intermediate = key+merge_p;
		var sha1sum = crypto.createHash(hash_algo).update(intermediate)
		hashed_key = Buffer.concat([hashed_key, sha1sum.digest()])
	}

	var kautz_string = ""
	while (kautz_string.length < out_length) {
		kautz_string = ""

		intermediate = key+merge_p
		var sha1sum = crypto.createHash(hash_algo).update(intermediate)
		hashed_key = Buffer.concat([hashed_key, sha1sum.digest()])
		merge_p++

		for (i=0; i<hashed_key.length;i++) {
			kautz_string += base(target_base, hashed_key[i], 10)
		}

		kautz_string = kautz_string.substring( (kautz_string.length-1-digit), (kautz_string.length-1) )

		var c = kautz_string[0]
		for (i=1; i<kautz_string.length;i++) {
			if (c == kautz_string[i]) {
				kautz_string = (kautz_string.slice(0, i) + kautz_string.slice(i+1, kautz_string.length))
				i--	
			}
			c = kautz_string[i]
		}
	}
	kautz_string = kautz_string.substring( (kautz_string.length-1-out_length), kautz_string.length-1 )
	return kautz_string
}

// var to_kautz_string2 = function(ip, port, out_length) {
// 	var intermediate = ""+ip+":"+port

// 	var hashed_key = crypto.createHash(hash_algo).update(intermediate).digest()
// 	var kautz_string = ""
// 	for (i=0; i<hashed_key.length;i++) {
// 		kautz_string += base(target_base, hashed_key[i], 10)
// 	}

// 	var c = kautz_string[0]
// 	for (i=1; i<kautz_string.length;i++) {
// 		if (c == kautz_string[i]) {
// 			kautz_string = (kautz_string.slice(0, i) + kautz_string.slice(i+1, kautz_string.length))
// 			i--	
// 		}
// 		c = kautz_string[i]
// 	}
// 	return kautz_string.substring( (kautz_string.length-1-out_length), kautz_string.length-1 )
// }

var key_count = 1024

var arr = []
var ip_suffix = 0
for (var keys = 0; keys<key_count; keys++) {
	arr[keys] = to_kautz_string(ip, parseInt(port)+keys, out_length, k_space, digit, merge_p)
	// arr[keys] = to_kautz_string2(ip+ip_suffix, parseInt(port)+keys, out_length)
	if (ip_suffix%255==0) ip_suffix=0
	ip_suffix++
}

var coll_count = 0
arr.sort()

for (var i=0; i<arr.length-1;i++) {
	if (arr[i] == arr[i+1]) {
		// console.log(arr[i] + " collision")
		coll_count++
	}
	// else console.log(arr[i])
}

console.log("Collisions: "+coll_count)