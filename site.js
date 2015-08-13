window.onload = function() {
	var hash = window.location.hash.substr(1);
	if (hash) {
		console.log("joining multiplayer game "+hash);
		GAMESTATE.joinGame(hash);
	} else {
		console.log("starting new offline game");
		var getWords = new XMLHttpRequest();
		getWords.onload = function() {
			UI.show_mp_menu(0);
			GAMESTATE.createGame(this.responseText.split("\n"));
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
