// Author: Frans Ojala (013865821)

var crypto = require('crypto')
var base = require('anybase')

// generate kautz-hashes according to the pseudocode algo presented in FISSIONE using
// ip and port as key. This implementation can produce kautz-strings for any kautz-space.
function to_kautz_string(ip, port, out_length, degree, digit, hash_algo, digest_type) {
	var merge_p = 0
	var target_base = parseInt(degree)+1

	var key = ""+ip+":"+port

	// merge the 0...k-1 to the end of the key, hash it and concat it with the previous
	var intermediate = key+merge_p
	var hashed_key = crypto.createHash(hash_algo).update(intermediate).digest(digest_type)
	for (merge_p = 1; merge_p<degree; merge_p++) {
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

		while ((index = kautz_string.indexOf('undefined')) > -1) {
			kautz_string = kautz_string.slice(0, index) + kautz_string.slice(index+9, kautz_string.length)
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
		var index
	}
	kautz_string = kautz_string.substring( (kautz_string.length-1-out_length), kautz_string.length-1 )
	return kautz_string
}

module.exports = to_kautz_string