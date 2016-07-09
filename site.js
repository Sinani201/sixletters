var LEVELS_COUNT = 1069;

/**
 * Should be called after the game UI has been initialized.  Allows the user to
 * click on the last input letter to backspace it, and click on available
 * letters to input them.
 */
function setupMouseInput() {
	// If the user clicks on the last slot with a letter, backsapce it.
	var div_letter_slots_c = document.getElementById("letter-slots").children;
	for (var i = 0; i < div_letter_slots_c.length; i++) {
		div_letter_slots_c[i].onclick = function() {
			var sib = this.nextElementSibling;
			if (!(sib && sib.childNodes.length)) {
				GAMESTATE.backspaceChar();
			}
		}
	}

	// Click on an available letter to input it.
	var div_letters_c = document.getElementById("letters").children;
	for (var i = 0; i < div_letters_c.length; i++) {
		// Has to go in a function closure so the i variable keeps its value for
		// each individual div.
		(function(a) {
			div_letters_c[i].onclick = function() {
				GAMESTATE.enterChar(a);
			};
		})(i);
	}
}

/**
 * Checks if a name is valid.
 *
 * @param name String The name to check
 * @return String An error message detailing why this name is invalid, or null
 *                if the name is valid.
 */
function validateName(name) {
	if (name.length <= 0) {
		return "No empty names allowed";
	} else if (name.length > 10) {
		return "Name may not be longer than ten characters";
	} else if (!name.match(/^[0-9a-zA-Z]+$/)) {
		return "Name must only use alphanumeric characters";
	} else {
		return null;
	}
}

window.onload = function() {
	var hash = window.location.hash.substr(1);
	if (hash) {
		GAMESTATE.joinGame(hash, setupMouseInput);
	} else {
		var getLevel = new XMLHttpRequest();
		getLevel.onload = function() {
			if (this.status == 404) {
				// fall back to downloading the whole word list
				var getWords = new XMLHttpRequest();
				getWords.onload = function() {
					UI.show_mp_menu(0);
					GAMESTATE.createGame(this.responseText.split("\n"));
					setupMouseInput();
				};
				getWords.responseType = "text";
				getWords.open("get", "words.txt", true);
				getWords.send();
			} else {
				UI.show_mp_menu(0);
				GAMESTATE.createGame(this.responseText.split("\n"));
				setupMouseInput();
			}
		};

		getLevel.responseType = "text";

		// generate a random level number
		var levelnum = Math.floor(Math.random() * LEVELS_COUNT);
		var padded = "000" + levelnum;
		padded = padded.substr(padded.length - 4);

		getLevel.open("get", "levels/" + padded + ".txt", true);
		getLevel.send();
	}

	document.getElementById("b-enter").onclick = GAMESTATE.submitWord;
	document.getElementById("b-shuffle").onclick = GAMESTATE.shuffleLetters;
	document.getElementById("b-giveup").onclick = function() {
		document.getElementById("b-ungiveup").style.display = "inline";
		this.style.display = "none";
		GAMESTATE.giveUp(true);
	};
	document.getElementById("b-ungiveup").onclick = function() {
		document.getElementById("b-giveup").style.display = "inline";
		this.style.display = "none";
		GAMESTATE.giveUp(false);
	};

	document.getElementById("b-host").onclick = function() {
		UI.show_mp_menu(1);
	};

	document.getElementById("b-cancelname").onclick = function() {
		UI.show_mp_menu(0);
	};

	document.getElementById("b-entername").onclick = function() {
		var entered_name = document.getElementById("input-name").value;
		var nameError = validateName(entered_name);
		if (nameError) {
			var span_error = document.getElementById("nameerror");
			if (span_error.childNodes.length) {
				span_error.removeChild(span_error.firstChild);
			}
			span_error.appendChild(document.createTextNode(nameError));
		} else {
			if (hash) {
				// we are joining a game that already exists
				GAMESTATE.sendName(entered_name);
				UI.display_gamename(hash);
			} else {
				// we are creating a new game
				GAMESTATE.hostGame(entered_name);
			}
		}
	};


	window.addEventListener("keydown",  function(e) {
		// if we are in a text field, don't treat the input in a special way
		var d = e.srcElement || e.target;
		var key = e.keyCode || e.which;
		if (d.tagName.toUpperCase() === "INPUT" && d.type.toUpperCase() === "TEXT") {
			if (key === 13) { // enter
				if (d.id === "input-name") {
					document.getElementById("b-entername").click();
				}
			}
		} else {
			var keychar = String.fromCharCode(key);
			var div_letters = document.getElementById("letters");
			var letters = div_letters.children;

			if (key === 8) { // backspace
				e.preventDefault();
				GAMESTATE.backspaceChar();
			} else if (key === 13) { // enter
				GAMESTATE.submitWord();
			} else if (key === 32) { // space
				GAMESTATE.shuffleLetters();
			} else {
			  var i = GAMESTATE.indexOfLetter(keychar);
			  if (i > -1) {
				  GAMESTATE.enterChar(i);
			  }
			}
		}
	});
};
