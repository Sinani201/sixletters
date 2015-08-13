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
			console.log(sib);
			if (!(sib && sib.childNodes.length)) {
				GAMESTATE.backspaceChar();
			}
		}
		console.log(div_letter_slots_c[i]);
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

window.onload = function() {
	var hash = window.location.hash.substr(1);
	if (hash) {
		console.log("joining multiplayer game "+hash);
		GAMESTATE.joinGame(hash);
		setupMouseInput();
	} else {
		console.log("starting new offline game");
		var getWords = new XMLHttpRequest();
		getWords.onload = function() {
			UI.show_mp_menu(0);
			GAMESTATE.createGame(this.responseText.split("\n"));
			setupMouseInput();
		};
		getWords.responseType = "text";
		getWords.open("get", "words.txt", true);
		getWords.send();
	}

	document.getElementById("b-shuffle").onclick = GAMESTATE.shuffleLetters;
	document.getElementById("b-enter").onclick = GAMESTATE.submitWord;
	document.getElementById("b-clear").onclick = function() {
		while(GAMESTATE.backspaceChar());
	};
	document.getElementById("b-giveup").onclick = GAMESTATE.revealAll;

	document.getElementById("b-host").onclick = function() {
		UI.show_mp_menu(1);
	};

	document.getElementById("b-cancelname").onclick = function() {
		show_mp_menu(0);
	};

	document.getElementById("b-entername").onclick = function() {
		var entered_name = document.getElementById("input-name").value;
		if (hash) {
			// we are joining a game that already exists
			GAMESTATE.sendName(entered_name);
			UI.display_gamename(hash);
		} else {
			// we are creating a new game
			GAMESTATE.hostGame(entered_name, function(lobby) {
				show_mp_menu(2);
				console.log("Lobby name: "+lobby);
				UI.display_gamename(lobby);
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
				GAMESTATE.backspaceChar();
			} else if (key === 13) { // enter
				GAMESTATE.submitWord();
			} else {
			  var i = GAMESTATE.indexOfLetter(keychar);
			  if (i > -1) {
				  GAMESTATE.enterChar(i);
			  }
			}
		}
	});
};
