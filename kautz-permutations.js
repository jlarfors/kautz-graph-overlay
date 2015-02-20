var crypto = require('crypto')
var base = require('anybase')
var util = require('util')

function kautz_perms(degree, k_space) {
	// var inputErr = "Usage: kautz-strings <degree> <k_space> <key_count>"
	// if (process.argv.length < 3) {
	// 	console.log(inputErr)
	// 	process.exit()
	// }

	// var degree = parseInt(process.argv[2])
	// var k_space = parseInt(process.argv[3])

	var key_count = Math.pow(degree, k_space) + Math.pow(degree, k_space-1)

	var strings = []

	var string_index = 0
	var input = 0
	while (strings.length < key_count) {
		var hash = crypto.createHash('sha256').update(input+"").digest('hex').toUpperCase()
		var tern = base(degree+1, hash, 16)

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

		kautz_string = kautz_string.substring( (kautz_string.length-1-k_space), kautz_string.length-1 )
		if (strings.indexOf(kautz_string) < 0) {
			strings[string_index] = kautz_string
			console.log[strings[string_index]+ " " +strings[string_index].length + strings.length]
			string_index++
		}
		input++
	}
	return strings
}

module.exports = function(degree, k_space) {
	return new kautz_perms(degree, k_space)
}