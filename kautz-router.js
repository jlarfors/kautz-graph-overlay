// Authors: Frans Ojala (013865821) Jacok Lärfors ()

// DEPRECATED

// The routing algorithm that is modeled after longest postfix-prefix matching
// just for testing purposes to determine if the resulting network is viable
function route(src, dst, arr, out_neighbour_1, out_neighbour_2) {
	var U = arr[src]
	var W = arr[dst]
	var visited = []

	while (src != dst) {

		var V
		var V1
		var V2

		// if we arrive at a node with no out-neighbours the route is dead and exit
		if (out_neighbour_1[src] == undefined && out_neighbour_2[src] == undefined) {
			visited[visited.length] = "Dead"
			return visited
		}

		// check if the route we're about to take has already been taken. we
		// allow the routing to a node that has been visited, but not a route
		// that has already been taken as that would entail a loop. Use this
		// or the one after this for different results
		// function vertexExists(K, L) {
		// 	var firstIndex = visited.indexOf(K)
		// 	var lastIndex = visited.lastIndexOf(K)
		// 	if (firstIndex < 0) return false
		// 	else return ((visited[firstIndex+1] == L) || (visited[lastIndex+1] == L))
		// }

		// an alternative routing mechanism, where we don't allow going to a
		// node that has been visited. Use this or the previous one
		function vertexExists(K, L) {
			return visited.indexOf(K)>-1
		}

		// check the longest postfix-prefix match
		var cutoff = 0
		while (cutoff<U.length-1) {
			cutoff++
			if (out_neighbour_1[src] != undefined) V1 = arr[out_neighbour_1[src]].slice(0, U.length-cutoff)
			if (out_neighbour_2[src] != undefined) V2 = arr[out_neighbour_2[src]].slice(0, U.length-cutoff)
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
		
		// check if there is a match, else go to either of the two out-neighbours
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

		// end if the route is too long
		if (visited.length > 100) {
			visited[visited.length] = src
			visited[visited.length] = "Long"
			return visited
		}
	}
	return visited
}

module.exports = route