// treeNsMj -- tree with N symmetries and level M of BIT-enumeration of coeficients
tree3s1j = {symmetries: 3, bychkovskiy_level: 1};
tree3s1j.traverse = function(get_direction) {
	let direction = get_direction(0, [0n, 1n])
	if (direction == 0) return [[0n, 1n], ""];
	let current = [direction > 0 ? 1n : -1n, 1n];
	let path = [direction > 0 ? "1" : "0"];
	direction = get_direction(1, current);
	if (direction == 0) return [current, path.join("")];
	path.push(direction > 0 ? "1" : "0");
	let [alpha, beta, i] = [1n, 1n, parseInt(path.join(""), 2)];
	let [left, right] = [[-1n, 0n], [-1n, 1n], [0n, 1n], [1n, 1n], [1n, 0n]].slice(i, i + 2);
	current = [alpha * left[0] + beta * right[0], alpha * left[1] + beta * right[1]];
	while (direction = get_direction(path.length, current)) {
		if (path.length > 1024) return ["ABOBA", "ABOBA"];
		path.push(direction > 0 ? "1" : "0");
		if ((alpha + beta) % 2n == 1) {
			[alpha, beta, left, right] = [
				1n, 1n,
				[(alpha + BigInt(alpha > beta)) * left[0] + (beta - BigInt(beta > alpha)) * right[0],
					(alpha + BigInt(alpha > beta)) * left[1] + (beta - BigInt(beta > alpha)) * right[1]],
				[(alpha - BigInt(alpha > beta)) * left[0] + (beta + BigInt(beta > alpha)) * right[0],
					(alpha - BigInt(alpha > beta)) * left[1] + (beta + BigInt(beta > alpha)) * right[1]]
			];
			[left, right] = direction < 0 ? [left, current] : [current, right];
		} else if (!(alpha + beta).toString(2).substr(1).includes("1")) {
        	if (direction > 0 && alpha == 1)
            	beta += alpha + beta;
			else if (direction < 0 && beta == 1)
                alpha += alpha + beta;
			else if (direction < 0 && alpha == 1)
                beta -= (alpha + beta) / 4n;
			else if (direction > 0 && beta == 1)
                alpha -= (alpha + beta) / 4n;
		} else {
			if (alpha > beta)
				alpha += (direction < 0 ? 1n : -1n) * ((alpha + beta) & -(alpha + beta)) / 2n;
			else
				beta += (direction > 0 ? 1n : -1n) * ((alpha + beta) & -(alpha + beta)) / 2n;
		}
		current = [alpha * left[0] + beta * right[0], alpha * left[1] + beta * right[1]];
	}
	return [current, path.join("")];
}
tree3s1j.encode = number => tree3s1j.traverse((_, x) => number[0] * x[1] - number[1] * x[0])[1];
tree3s1j.decode = path => tree3s1j.traverse(i => ({"0": -1, "1": 1}[path[i]] ?? 0))[0];

function parseFraction(string) {
	let [numerator, denominator] = string.replace(/ /g, '').split("/");
	numerator = BigInt(numerator);
	if ((denominator = BigInt(denominator || 1)) == 0)
		throw new Error("Division by zero");
	return [numerator, denominator];
}

function fractionToString(fraction) {
	let [numerator, denominator] = fraction;
	if (denominator == 1) return numerator.toString();
	return `${numerator} / ${denominator}`
}

let backgroundTree = [];
function updateBackgroundTree(targetCode) {
	for (let [code, node] of backgroundTree) {
		if (targetCode != undefined && targetCode.indexOf(code) == 0) {
			node.style.zIndex = -1;
			if (targetCode == code)
				node.style.color = "#23ffff";
			else
				node.style.color = "#2389ff";
		} else {
			node.style.color = "inherit";
			node.style.zIndex = -2;
		}
	}
}

window.onload = function() {
	let number_representation_form = document.getElementById("number_representation");
	let binary_representation_form = document.getElementById("binary_representation");
	let integer_representation_form = document.getElementById("integer_representation");
	for (let lvl = 0; lvl < 7; lvl++) {
		let y = lvl / (7 - 1);
		for (let i = 0; i < Math.pow(2, lvl); i++) {
			let code = i.toString(2).padStart(lvl, "0").substr(0, lvl);
			let x = (1 + i * 2) / Math.pow(2, lvl + 1);
			let tree = document.createElement("span");
			tree.style.position = "fixed";
			tree.style.textAlign = "center";
			tree.style.transform = "translate(-50%, -50%)";
			tree.style.zIndex = -1;
			let [numerator, denominator] = tree3s1j.decode(code);
			tree.innerHTML = `${numerator}<br>──<br>${denominator}`;
			tree.style.left = `calc(1ex + (100% - 2ex) * ${x})`;
			tree.style.top = `calc(3em + (100% - 6em) * ${y})`;
			document.getElementsByClassName("tree")[0].appendChild(tree);
			backgroundTree.push([code, tree]);
		}
	}
	number_representation_form.oninput = function() {
		try {
			if (this.value == "") throw new Error("No number specified");
			let code = tree3s1j.encode(parseFraction(this.value));
			binary_representation_form.value = code || "\u200b";
			integer_representation.value = BigInt(`0b1${code}`, 2);
			updateBackgroundTree(code);
		} catch (error) {
			// binary_representation_form.value = `ERROR: ${error.message}`;
			// integer_representation_form.value = `ERROR: ${error.message}`;
			binary_representation_form.value = "";
			integer_representation_form.value = "";
			updateBackgroundTree();
		}
	}
	binary_representation_form.oninput = function() {
		try {
			let number = tree3s1j.decode(this.value.replace(/ /g, ""));
			let code = tree3s1j.encode(number);
			number_representation_form.value = fractionToString(number);
			integer_representation.value = BigInt(`0b1${code}`, 2);
			updateBackgroundTree(code);
		} catch (error) {
			// number_representation_form.value = `ERROR: ${error.message}`;
			// integer_representation_form.value = `ERROR: ${error.message}`;
			number_representation_form.value = "";
			integer_representation_form.value = "";
			updateBackgroundTree();
		}
	}
	integer_representation_form.oninput = function() {
		try {
			let code = BigInt(this.value).toString(2).substr(1);
			binary_representation_form.value = code || "\u200b";
			number_representation_form.value = fractionToString(tree3s1j.decode(code));
			updateBackgroundTree(code);
		} catch (error) {
			// binary_representation_form.value = `ERROR: ${error.message}`;
			// number_representation_form.value = `ERROR: ${error.message}`;
			binary_representation_form.value = "";
			number_representation_form.value = "";
			updateBackgroundTree();
		}
	}
}
