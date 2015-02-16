# kautz-graph-overlay
An overlay network implemented using a static kautz graph

# Kautz-hash
To use the kautz_hash.js node program to generate kautz-hashes you must have node installed. Then go to the directory that contains kautz_hash.js and install node package anybase by typing
	$> npm install anybase

To use the program type
	$> node kautz_hash.js 127.0.0. 51000 100 2 300

Replace 127.0.0. with a host prefix of your choise, 51000 with some port number, 100 with the length of the resulting kautz-string, 2 with the desired degree of the graph and 300 as the intermediate string length which should always be at least double of the resulting string length.

