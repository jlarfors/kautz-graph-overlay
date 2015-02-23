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

module.exports = getOutNeighbours