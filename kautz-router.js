// The routing algorithm that is modeled after longest postfix-prefix matching
// just for testing purposes to determine if the resulting network is viable
function route(src, dst, arr, out_neighbour_1, out_neighbour_2) {
	var U = arr[src]
	var W = arr[dst]
	var visited = []
	var hops = 0
	while (src != dst) {

		var cutoff = 0
		var V

		var V1
		var V2
		if (!out_neighbour_1[src] && !out_neighbour_2[src]) {
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
			if (out_neighbour_1[src]) V1 = arr[out_neighbour_1[src]].slice(0, U.length-cutoff)
			if (out_neighbour_2[src]) V2 = arr[out_neighbour_2[src]].slice(0, U.length-cutoff)
			var temp_V = W.slice(cutoff, U.length)
			if (V1 == temp_V && !vertexExists(src, out_neighbour_1[src])) {
			 	V = out_neighbour_1[src]
			 	break
			}
			else if (V2 == temp_V && !vertexExists(src, out_neighbour_2[src])) {
				V = out_neighbour_2[src]
				break
			}
		}
		
		if (V) {
			visited[visited.length] = src
			src = V
			V = null
		} else if (!vertexExists(src, out_neighbour_1[src])) {
			visited[visited.length] = src
			src = out_neighbour_1[src]
		} else if (!vertexExists(src, out_neighbour_2[src])) {
			visited[visited.length] = src
			src = out_neighbour_2[src]
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

module.exports = route