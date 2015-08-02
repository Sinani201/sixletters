function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }

    return array;
}

function split(s, separator, limit) {
  // split the initial string using limit
  var arr = s.split(separator, limit);
  // get the rest of the string...
  var left = s.substring(arr.join(separator).length + separator.length);
  // and append it to the array
  arr.push(left);
  return arr;
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

// if the game is in multiplayer mode, this should be the socket
var mp_sock = null;
var mp_player_name = null;

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
	console.log(game);
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

		answers = game.map(function(a) { return a.map(function(b) { return [b, false]; }); });
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
function revealWord(group, index, name) {
	if (!answers[group][index][1]) {
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

		if (typeof(name) === "undefined") name = true;
		answers[group][index][1] = name;
	}
}

function revealAll() {
	for (var i = 0; i < answers.length; i++) {
		for (var j = 0; j < answers[i].length; j++) {
			revealWord(i, j);
		}
	}
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

// reveals this word under `name`, if it is correct
function submitWord(word, name) {
	word = word.toLowerCase();

	var a = checkWord(word);
	if (a) {
		if (a[2]) {
		} else {
			revealWord(a[0], a[1]);
		}
	}
}

// should be called when the local player submits a word (presses enter)
// if the user is in a multiplayer game, this will annouce to the server
// that this word has been attempted
function selfSubmitWord() {
	var word = getEnteredWord().toLowerCase();
	while(backspaceChar());
	submitWord(word);
	mp_sock.send(":attempt "+word);
}

function mp_other_attempt(word, player) {
	submitWord(word, player);
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

function common_onmsg(event) {
	console.log(">"+event.data);
	var attempt_command = ":attempt ";
	if (event.data.substring(0, attempt_command.length) === attempt_command) {
		sdata = split(event.data, " ", 2);
		mp_other_attempt(sdata[1], sdata[2]);
	} else {
		var sdata = split(event.data, " ", 1);
		if (sdata[0] === ":join") {
			onPlayerJoin(sdata[1]);
		}
	}
}

// creates the websocket connection that hosts the game
// name should be the name of this player
// callback should be the function to call once the server gives us the game id.
// it will be called with that game id as a parameter
function host_game(name, callback) {
	var sock = new WebSocket("ws://127.0.0.1/");

	sock.onopen = function (event) {
		sock.send(":host "+name);
		
		console.log(answers.length);
		for (var i = 0; i < answers.length; i++) {
			for (var j = 0; j < answers[i].length; j++) {
				sock.send(answers[i][j][0]+(answers[i][j][1] ? " y" : " n"));
			}
		}

		sock.send(":endwords");
	};

	sock.onmessage = function (event) {
		// TODO: if the socket is cloesd, do something
		callback(event.data);
		onPlayerJoin(name);
		mp_player_name = name;
		mp_sock = sock;
		sock.onmessage = common_onmsg;
	};
}

function mp_sendname(name) {
	mp_player_name = name;
	mp_sock.send(name);
}

function join_game(gamename) {
	var sock = new WebSocket("ws://127.0.0.1/");
	
	var state = 0;
	var sent_words = [];

	sock.onopen = function (event) {
		sock.send(":join "+gamename);
	};

	sock.onmessage = function (event) {
		if (state === 0) {
			if (event.data == ":nolobby") {
				// TODO: display this error to the user
				console.log("error: no lobby of that name");
			} else {
				state = 1;
			}
		}
		if (state === 1) {
			sdata = split(event.data, " ", 1);
			if (sdata[0] === ":player") {
				onPlayerJoin(sdata[1]);
			} else if (sdata[0] === ":endplayers") {
				state = 2;
				mp_sock = sock;
				show_mp_menu(1);
			}
		} else if (state === 2) {
			if (event.data === ":badname") {
				// TODO: display this error to the user
				console.log("error: bad name");
			} else {
				onPlayerJoin(mp_player_name);
				state = 3;
			}
		}
		if (state === 3) {
			word = event.data.split(" ", 1)[0];
			if (word !== ":endwords") {
				sent_words.push(word);
			} else {
				constructGame(generateGame(sent_words));
				mp_sock = sock;
				sock.onmessage = common_onmsg;
				show_mp_menu(2);
			}
		}
	};
}

// appends this element to the log
function logmsg(element) {
	element.classList.add("logmsg");
	document.getElementById("log").appendChild(element);
}

function onPlayerJoin(newplayer) {
	// create the log message
	var d = document.createElement("div");
	var span_pname = document.createElement("span");
	span_pname.className = "playername";
	span_pname.appendChild(document.createTextNode(newplayer));
	d.appendChild(span_pname);
	d.appendChild(document.createTextNode(" has joined the game."));

	logmsg(d);

	// add this player to the list of players
	var li = document.createElement("li");
	var span_pname = document.createElement("span");
	span_pname.className = "playername";
	span_pname.appendChild(document.createTextNode(newplayer));
	li.appendChild(span_pname);

	var ul_playerul = document.getElementById("playerul");
	ul_playerul.appendChild(li);
}

// show the user this game's unique URL
function display_gamename(gamename) {
	document.getElementById("input-sharelink").value = document.URL+"#"+gamename;
}

// show a different stage of multiplayer game
// 0: default (just the share button)
// 1: enter name box
// 2: gameinfo box
function show_mp_menu(n) {
	var stages = [
		document.getElementById("sharebutton"),
		document.getElementById("entername"),
		document.getElementById("gameinfo")
	];
	for (var i = 0; i < stages.length; i++) {
		if (i === n) {
			stages[i].style.display = "block";
		} else {
			stages[i].style.display = "none";
		}
	}
}

window.onload = function() {
	var hash = window.location.hash.substr(1);
	if (hash) {
		console.log("joining multiplayer game "+hash);
		join_game(hash);
	} else {
		console.log("starting new offline game");
		var getWords = new XMLHttpRequest();
		getWords.onload = function() {
			show_mp_menu(0);
			var answerWords = generateGame(this.responseText.split("\n"));
			constructGame(answerWords);
		};
		getWords.responseType = "text";
		getWords.open("get", "words.txt", true);
		getWords.send();
	}

	document.getElementById("b-shuffle").onclick = shuffleLetters;
	document.getElementById("b-enter").onclick = selfSubmitWord;
	document.getElementById("b-clear").onclick = function() {
		while(backspaceChar());
	};
	document.getElementById("b-giveup").onclick = revealAll;

	//document.getElementById("b-host").onclick = host_game;
	document.getElementById("b-host").onclick = function() {
		show_mp_menu(1);
	};

	document.getElementById("b-cancelname").onclick = function() {
		show_mp_menu(0);
	};

	document.getElementById("b-entername").onclick = function() {
		var entered_name = document.getElementById("input-name").value;
		if (hash) {
			// we are joining a game that already exists
			mp_sendname(entered_name);
			display_gamename(hash);
		} else {
			// we are creating a new game
			host_game(entered_name, function(lobby) {
				show_mp_menu(2);
				console.log("Lobby name: "+lobby);
				display_gamename(lobby);
			});
		}
	};

	window.addEventListener("keydown",  function(e) {
		// if we are in a text field, don't treat the input in a special way
		var d = e.srcElement || e.target;
		if (d.tagName.toUpperCase() === "INPUT" && d.type.toUpperCase() === "TEXT") {
		} else {
			var key = e.keyCode || e.which;
			var keychar = String.fromCharCode(key);
			var div_letters = document.getElementById("letters");
			var letters = div_letters.children;

			if (key === 8) { // backspace
				e.preventDefault();
				backspaceChar();
			} else if (key === 13) { // enter
				selfSubmitWord();
			} else {
				for (var i = 0; i < letters.length; i++) {
					if (letters[i].childNodes.length && letters[i].childNodes[0].textContent.toLowerCase() === keychar.toLowerCase()) {
						document.activeElement.blur();
						enterChar(i);
						break;
					}
				}
			}
		}
	});
};
