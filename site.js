function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }

    return array;
}

function permute(input) {
    var permArr = [],
        usedChars = [];
    return (function main() {
        for (var i = 0; i < input.length; i++) {
            var ch = input.splice(i, 1)[0];
            usedChars.push(ch);
            if (input.length == 0) {
                permArr.push(usedChars.slice());
            }
            main();
            input.splice(i, 0, ch);
            usedChars.pop();
        }
        return permArr;
    })();
}

function uniq_fast(a) {
	var seen = {};
	var out = [];
	var len = a.length;
	var j = 0;
	for(var i = 0; i < len; i++) {
		var item = a[i];
		if(seen[item] !== 1) {
			seen[item] = 1;
			out[j++] = item;
		}
	}
	return out;
}

function getUniqPermutations(list, maxLen) {
	return uniq_fast(permute(list).map(function(l) { return l.slice(0, maxLen); }));
}

// a list of lists of [string, boolean] pairs where the strings are words and
// the boolean is true if that word has been found by the player
var answers = [];

// takes an array of all words that have between 3-6 chars
// and returns a list of words for the game
function generateGame(words) {
	// pick a random 6 letter word
	var possibilities = words.filter(function(s) { return s.length === 6 });
	var baseWord = possibilities[Math.floor(Math.random() * possibilities.length)];
	//baseWord = "tuxedo";
	//baseWord = "mallet"; // 39:08
	//baseWord = "gazebo";
	//baseWord = "chosen";

	baseWord = baseWord.split('');

	var output = [];
	for (var i = 3; i <= 6; i++) {
		var ss = getUniqPermutations(baseWord, i).map(function(a) { return a.join(""); }).filter( function(s) { return words.indexOf(s) > -1 }).sort();

		output.push(ss);
	}

	return output;
}

// takes a list of words for a game (should already be sorted)
// and modifies the DOM with it
function constructGame(game) {
	// first decide how the columns will be divied up
	var max_rows = 20;
	var word_amounts = game.map(function(a) { return [a.length, 0] });
	var total_words = word_amounts.reduce(function(a, b) { return a + b[0] }, 0);
	var current_group = 0;
	outer:
	for (var i = max_rows; i < total_words; i++) {
		while (word_amounts[current_group][0] - word_amounts[current_group][1] <= 1) {
			current_group++;
			if (current_group >= word_amounts.length) {
				break outer;
			}
		}

		word_amounts[current_group][0] -= 1;
		word_amounts[current_group][1] += 1;
	}

	var div_finished_words = document.getElementById("finished-words");
	for (var i = 0; i < game.length; i++) {
		var div_group = document.createElement("div");
		div_group.className = "word-group";

		var w = 0;
		for (var j = 0; j < word_amounts[i].length; j++) {
			var div_column = document.createElement("div");
			div_column.className = "word-column";

			for (var k = 0; k < word_amounts[i][j]; k++) {
				var table_word = document.createElement("table");
				table_word.className = "word";

				var tr = document.createElement("tr");

				for (var l = 0; l < game[i][w].length; l++) {
					var td = document.createElement("td");
					//td.appendChild(document.createTextNode("_"));
					//td.appendChild(document.createTextNode(game[i][w][l].toUpperCase()));
					tr.appendChild(td);
				}

				tr.onclick = function() {
					var word = "";
					for (var m = 0; m < this.children.length; m++) {
						var c = this.children[m].childNodes;
						if (c.length) {
							word = word + c[0].textContent;
						} else {
							return;
						}
					}

					window.open("http://ninjawords.com/"+word.toLowerCase(), '_blank');
				};

				table_word.appendChild(tr);

				div_column.appendChild(table_word);
				w++;
			}

			div_group.appendChild(div_column);
		}

		div_finished_words.appendChild(div_group);
	}

	var starting_letters = shuffle(game[game.length-1][0].split(''));
	var div_letter_slots = document.getElementById("letter-slots");
	var div_letters = document.getElementById("letters");
	for (var i = 0; i < starting_letters.length; i++) {
		// add the empty slots
		var div_slot = document.createElement("div");
		div_slot.className = "slot";

		// if we click on the last slot that contains a letter, backspace it.
		div_slot.onclick = function() {
			var sib = this.nextElementSibling;
			if (!(sib && sib.childNodes.length)) {
				backspaceChar();
			}
		}

		div_letter_slots.appendChild(div_slot);

		// add the actual letters
		var div_letter = document.createElement("div");
		div_letter.className = "letter";
		div_letter.appendChild(document.createTextNode(starting_letters[i].toUpperCase()));

		// if we click on this div, make it enter a char.
		// has to go in a function closure so the i variable
		// keeps its value for each individual div
		(function(a) {
			div_letter.onclick = function() { enterChar(a); };
		})(i);
		div_letters.appendChild(div_letter);
	}
}

function getEnteredWord() {
	var div_slots = document.getElementById("letter-slots");

	var word = "";
	for (var i = 0; i < div_slots.children.length; i++) {
		if (div_slots.children[i].childNodes.length) {
			word = word + div_slots.children[i].childNodes[0].textContent;
		} else {
			break;
		}
	}

	return word;
}

function enterChar(index) {
	var div_letters = document.getElementById("letters");
	var div_chosenLetter = div_letters.children[index];
	var div_slots = document.getElementById("letter-slots");

	if (div_chosenLetter.childNodes.length) {
		for (var i = 0; i < div_slots.children.length; i++) {
			if (!div_slots.children[i].childNodes.length) {
				div_slots.children[i].appendChild(
						document.createTextNode(div_chosenLetter.childNodes[0].textContent));
				div_chosenLetter.removeChild(div_chosenLetter.firstChild);
				break;
			}
		}
	}
}

// returns false if we backspaced the first char
function backspaceChar() {
	var div_letters = document.getElementById("letters");
	var div_slots = document.getElementById("letter-slots");

	for (var i = div_slots.children.length - 1; i >= 0; i--) {
		if (div_slots.children[i].childNodes.length) {
			var div_backspaced = div_slots.children[i];
			for (var j = div_letters.children.length - 1; j >= 0; j--) {
				if (!div_letters.children[j].childNodes.length) {
					div_letters.children[j].appendChild(
							document.createTextNode(div_backspaced.childNodes[0].textContent));
					break;
				}
			}
			div_backspaced.removeChild(div_backspaced.firstChild);
			break;
		}
	}

	return i > 0;
}

// reveals the word to the player by modifying the DOM
function revealWord(group, index) {
	var div_group = document.getElementById("finished-words").children[group];

	var table_word;
	var column1_length = div_group.children[0].children.length;
	if (index < column1_length) {
		table_word = div_group.children[0].children[index];
	} else {
		table_word = div_group.children[1].children[index - column1_length];
	}

	var tr = table_word.children[0];

	for (var i = 0; i < tr.children.length; i++) {
		tr.children[i].appendChild(document.createTextNode(
				answers[group][index][0][i].toUpperCase()));
	}

	tr.style.cursor = "pointer";

	answers[group][index][1] = true;
}

// if word is correct, returns a triple [a, b, c] where
// a is the group index of the word, b is the index of
// the word inside the group, and c is true if this word
// has already been revealed to the player
// if the word is incorrect, returns null
function checkWord(word) {
	for (var i = 0; i < answers.length; i++) {
		for (var j = 0; j < answers[i].length; j++) {
			if (answers[i][j][0] === word) {
				return [i, j, answers[i][j][1]];
			}
		}
	}
	return null;
}

function submitWord() {
	var word = getEnteredWord().toLowerCase();
	while(backspaceChar());

	var a;
	if (a = checkWord(word)) {
		if (a[2]) {
		} else {
			revealWord(a[0], a[1]);
		}
	}
}

function shuffleLetters() {
	var div_letters = document.getElementById("letters");

	var letters = [];
	for (var i = 0; i < div_letters.children.length; i++) {
		if (div_letters.children[i].childNodes.length) {
			letters.push(div_letters.children[i].childNodes[0].textContent);
		} else {
			letters.push("");
		}
	}

	shuffle(letters);

	for (var i = 0; i < div_letters.children.length; i++) {
		if (div_letters.children[i].childNodes.length) {
			div_letters.children[i].removeChild(div_letters.children[i].firstChild);
		}
		
		if (letters[i]) {
			div_letters.children[i].appendChild(document.createTextNode(letters[i]));
		}
	}
}

window.onload = function() {
	var getWords = new XMLHttpRequest();
	getWords.onload = function() {
		var answerWords = generateGame(this.responseText.split("\n"));
		constructGame(answerWords);
		answers = answerWords.map(function(a) { return a.map(function(b) { return [b, false]; }); });
	};
	getWords.responseType = "text";
	getWords.open("get", "words.txt", true);
	getWords.send();

	document.getElementById("b-shuffle").onclick = shuffleLetters;
	document.getElementById("b-enter").onclick = submitWord;
	document.getElementById("b-clear").onclick = function() {
		while(backspaceChar());
	};

	window.addEventListener("keydown",  function(e) {
		var key = e.keyCode || e.which;
		var keychar = String.fromCharCode(key);
		var div_letters = document.getElementById("letters");
		var letters = div_letters.children;

		if (key === 8) { // backspace
			e.preventDefault();
			backspaceChar();
		} else if (key === 13) { // enter
			submitWord();
		} else {
			for (var i = 0; i < letters.length; i++) {
				if (letters[i].childNodes.length && letters[i].childNodes[0].textContent.toLowerCase() === keychar.toLowerCase()) {
					document.activeElement.blur();
					enterChar(i);
					break;
				}
			}
		}
	});
};


