 function postfix(string, k) {
 	if (!string) return null
 	return string.slice(k, string.length)
 }

 function isPrefix(X, V) {
 	var prefix = V.slice(0, X.length)
 	return prefix == X
 }

 function route(src, dst, nodes, out_1, out_2){

	var node = src
	var path = [node]
	var S = ""
	var src_string = nodes[src]
	var dst_string = nodes[dst]
	var L = src_string.length

	if (src_string[src_string.length-1] == dst_string[0]) {
		S = dst_string[0]
		L--
	}

	while (node != dst && L > 0) {
		if (path.length > 99) {
			path[path.length] = 'Long'
			break
		}

		var X1 = postfix(nodes[out_1[node]], nodes[node].length-1)
		var X2 = postfix(nodes[out_2[node]], nodes[node].length-1)

		if (X1 != null && isPrefix(S+X1, dst_string)) {
			L--
			S+=X1
			node = out_1[node]
		} else if (X2 != null && isPrefix(S+X2, dst_string)) {
			L--
			S+=X2
			node = out_2[node]
		} else {
			path[path.length] = 'Dead'
			break
		}
		path[path.length] = node
	}
	return path
}

module.exports = route