var crypto = require('crypto')
var base = require('anybase')

function kautz_perms(degree, k_length, hash_algo, digest_type, origin_base) {
	var key_count = Math.pow(degree, k_length) + Math.pow(degree, k_length-1)

	var strings = []

	var string_index = 0
	var input = 0
	while (strings.length < key_count) {
		var hash = crypto.createHash(hash_algo).update(input+"").digest(digest_type).toUpperCase()
		var tern = base(degree+1, hash, origin_base)

		var index
		while ((index = tern.indexOf('undefined')) > -1) {
			tern = tern.slice(0, index) + tern.slice(index+9, tern.length)
		}

		var kautz_string = tern
		var c = kautz_string[0]
		for (i=1; i<kautz_string.length;i++) {
			if (c == kautz_string[i]) {
				kautz_string = (kautz_string.slice(0, i) + kautz_string.slice(i+1, kautz_string.length))
				i--	
			}
			c = kautz_string[i]
		}

		kautz_string = kautz_string.substring( (kautz_string.length-1-k_length), kautz_string.length-1 )
		if (strings.indexOf(kautz_string) < 0) {
			strings[string_index] = kautz_string
			console.log[strings[string_index]+ " " +strings[string_index].length + strings.length]
			string_index++
		}
		input++
	}
	return strings
}

module.exports = kautz_perms