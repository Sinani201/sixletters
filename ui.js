var UI = (function () {
	var m = {};

	/**
	 * Takes a list of words for a game and modifies the DOM to display them.
	 * @param game Array A list of words to use. 
	 *                   Should be broken up by word length.
	 */
	m.constructGame = function (game) {
		console.log(game);
		// first decide how the columns will be divied up
		var max_rows = 20;
		var word_amounts = game.map(function(a) { return [a.length, 0] });
		var total_words = word_amounts.reduce(
				function(a, b) { return a + b[0] }, 0);
		var current_group = 0;
		outer:
		for (var i = max_rows; i < total_words; i++) {
			while (word_amounts[current_group][0] -
					word_amounts[current_group][1] <= 1) {
				current_group++;
				if (current_group >= word_amounts.length) {
					break outer;
				}
			}

			word_amounts[current_group][0] -= 1;
			word_amounts[current_group][1] += 1;
		}

		// Create the empty boxes that will eventually contain words the player
		// guessed correctly (finished-words).
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

						window.open("http://ninjawords.com/"+word.toLowerCase(),
								'_blank');
					};

					table_word.appendChild(tr);

					div_column.appendChild(table_word);
					w++;
				}

				div_group.appendChild(div_column);
			}

			div_finished_words.appendChild(div_group);

		}

		//var starting_letters = shuffle(game[game.length-1][0].split(''));
		var div_letter_slots = document.getElementById("letter-slots");
		var div_letters = document.getElementById("letters");
		for (var i = 0; i < game[game.length-1][0].length; i++) {
			// add the empty slots
			var div_slot = document.createElement("div");
			div_slot.className = "slot";

			div_letter_slots.appendChild(div_slot);

			// add the letter boxes
			var div_letter = document.createElement("div");
			div_letter.className = "letter";

			div_letters.appendChild(div_letter);
		}
	}

	/**
	 * Returns the word that the user entered.
	 * @return String The word in the input box, in lowercase.
	 */
	m.getEnteredWord = function () {
		var div_slots = document.getElementById("letter-slots");

		var word = "";
		for (var i = 0; i < div_slots.children.length; i++) {
			if (div_slots.children[i].childNodes.length) {
				word = word + div_slots.children[i].childNodes[0].textContent;
			} else {
				break;
			}
		}

		return word.toLowerCase();
	}

	/**
	 * Returns the first available index of a character from the currently
	 * available choices.
	 * @param letter String The desired character.  Not case sensitive.
	 * @return Number the index of the chosen character, or -1 if the character
	 *  			  is not contained in the available slots.
	 */
	m.getIndexOfChar = function (letter) {
		var div_letters = document.getElementById("letters");
		var letters = div_letters.children;

		for (var i = 0; i < letters.length; i++) {
			if (letters[i].childNodes.length &&
					letters[i].childNodes[0].textContent.toLowerCase() ===
						letter.toLowerCase()) {
				return i;
			}
		}
		return -1;
	}

	/**
	 * Removes a letter from the list of letter choices.
	 * @param index Number The index of the letter to remove.
	 * @return String The character that was removed.
	 */
	m.removeLetterAtIndex = function (index) {
		var div_letters = document.getElementById("letters");
		var div_chosenLetter = div_letters.children[index];
		var c = div_chosenLetter.childNodes[0].textContent;
		div_chosenLetter.removeChild(div_chosenLetter.firstChild);
		return c;
	}

	/**
	 * Enters a single character to the input box.
	 * @param letter String The character to input.  Not case sensitive.
	 */
	m.enterChar = function (letter) {
		var div_slots = document.getElementById("letter-slots");

		for (var i = 0; i < div_slots.children.length; i++) {
			if (!div_slots.children[i].childNodes.length) {
				div_slots.children[i].appendChild(
						document.createTextNode(letter.toUpperCase()));
				break;
			}
		}
	}

	/**
	 * Removes the most recently typed letter in the list of slots.
	 * @return String The letter that was removed, in uppercase, or null if
	 * 				  all slots are empty.
	 */
	m.backspaceChar = function () {
		var div_letters = document.getElementById("letters");
		var div_slots = document.getElementById("letter-slots");

		for (var i = div_slots.children.length - 1; i >= 0; i--) {
			if (div_slots.children[i].childNodes.length) {
				var div_backspaced = div_slots.children[i];
				var letter = div_backspaced.childNodes[0].textContent;
				div_backspaced.removeChild(div_backspaced.firstChild);
				return letter;
			}
		}

		return null;
	}

	/**
	 * Adds a letter to the letter selection boxes.  The letter will go in the
	 * last empty box available.
	 * @param letter String The letter to add.  Not case sensitive.
	 * @return Number The index of the last empty box available (where the
	 * 				  letter was placed), or -1 if there was no empty spot
	 * 				  available.
	 */
	m.addToChoices = function (letter) {
		var div_letters = document.getElementById("letters");

		for (var i = div_letters.children.length - 1; i >= 0; i--) {
			if (!div_letters.children[i].childNodes.length) {
				div_letters.children[i].appendChild(
						document.createTextNode(letter.toUpperCase()));
				return i;
			}
		}
		return -1;
	}

	/**
	 * Replaces the letters in the available letters boxes with new ones.
	 *
	 * @param chars Array The new array of chars.  Not case sensitive.
	 */
	m.initChoices = function (chars) {
		var div_letters = document.getElementById("letters");

		for (var i = 0; i < div_letters.children.length; i++) {
			if (div_letters.children[i].childNodes.length) {
				div_letters.children[i].removeChild(
						div_letters.children[i].firstChild);
			}
			
			if (chars[i]) {
				div_letters.children[i].appendChild(
						document.createTextNode(chars[i].toUpperCase()));
			}
		}
	}

	/**
	 * Adds a message to the multiplayer log.
	 *
	 * @param element Element The element to add.
	 */
	function logmsg(element) {
		element.classList.add("logmsg");
		div_log = document.getElementById("log");
		div_log.appendChild(element);
		div_log.scrollTop = div_log.scrollHeight;
	}

	/**
	 * A list of all players in the game.  Each element is a [String, boolean]
	 * pair where the String is the player name and the boolean is false if the
	 * player has left the game.  If a player rejoins, the boolean is reset to
	 * true.
	 */
	var players = [];

	/**
	 * Get the index of a player name in the list of players.
	 */
	function indexOfPlayer(playername) {
		return players.map(function(a) { return a[0]; }).indexOf(playername);
	}

	/**
	 * Get a CSS color value for a given player index.
	 *
	 * Currently ignores the `maxplayers` arg and uses the algorithm described
	 * at http://gamedev.stackexchange.com/a/46469
	 *
	 * @param playernum Number The player number.  Should be 0-indexed.
	 * @param maxplayers Number The total amount of players.
	 * @param section String Where this color will be used.  Possible values:
	 *                       name, bg, none.
	 */
	function cssColorForSection(playernum, maxplayers, section) {
		var h = (playernum * 0.618033988749895) % 1.0;
		var s, l;

		switch(section) {
			case "name":
				s = 0.9;
				l = 0.4;
				break;
			case "bg":
				s = 0.9
				l = 0.85;
				break;
			default:
				s = 0;
				l = 0;
				break;
		}

		return "hsl("+Math.round(h*360)+","+Math.round(s*100)+"%,"+Math.round(l*100)+"%)";
	};

	/**
	 * Returns a CSS color string that corresponds to this playername.
	 *
	 * @param playername String The player to get the color of.
	 * @param section String Where this color should be.
	 *                       See cssColorForSection
	 * @return String The CSS color string.
	 */
	function playerColor(playername, section) {
		return cssColorForSection(indexOfPlayer(playername),
										 players.length, section);
	}

	/**
	 * Returns a span element for this player, using the correct color.
	 * @param playername String The player to make a span element for.
	 * @return Element The span element.
	 */
	function playerNameSpan(playername) {
		var span_pname = document.createElement("span");
		span_pname.className = "playername";
		span_pname.appendChild(document.createTextNode(playername));
		span_pname.style.color = playerColor(playername, "name");

		return span_pname;
	}

	/**
	 * Takes a HTML table element and colors it based on the player who
	 * answered it (it's `guesser` attribute)
	 *
	 * @param table_word Element The table element to color
	 */
	function colorWord(table_word) {
		var guesser = table_word.guesser;

		if (guesser) {
			var tr = table_word.children[0];

			for (var i = 0; i < tr.children.length; i++) {
				// if we are not in a multiplayer game, don't do any background
				// shading
				if (guesser !== true) {
					// This word was "guessed" via pressing the give up button--
					// give it white text on a black background
					if (guesser === 1)  {
						tr.children[i].style.backgroundColor = "black";
						tr.children[i].style.color = "white";
					} else {
						tr.children[i].style.backgroundColor =
								playerColor(guesser, "bg");
					}
				}
			}
		}
	}


	/** Calls the `colorWord` method on every word in the finished-words box. */
	function resetColors() {
		var table_words = document.getElementsByClassName("word");

		for (var i = 0; i < table_words.length; i++) {
			colorWord(table_words[i]);
		}
	}

	/**
	 * Reveals a word in one of the completed words boxes.
	 * @param word String The word to reveal.  Not case sensitive.
	 * @param group Number The word group that this word belongs in.
	 * @param index Number The index of this word in its respective word group.
	 * @param playername String The player that guessed this word (optional)
	 * @return Boolean true if this word was placed, false if there was already
	 *                 a word placed in that group/index location.
	 */
	m.revealWord = function (word, group, index, playername) {
		var div_group = document.getElementById("finished-words").children[group];

		var table_word;
		var column1_length = div_group.children[0].children.length;
		if (index < column1_length) {
			table_word = div_group.children[0].children[index];
		} else {
			table_word = div_group.children[1].children[index - column1_length];
		}

		table_word.guesser = playername;

		var tr = table_word.children[0];

		// abort this operation if there is already text written in this box
		if (tr.children[0].childNodes.length) {
			return false;
		}
		for (var i = 0; i < tr.children.length; i++) {
			tr.children[i].appendChild(document.createTextNode(
					word[i].toUpperCase()));
		}

		colorWord(table_word);

		tr.style.cursor = "pointer";

		if (typeof(name) === "undefined") name = true;

		// create the log message
		var d = document.createElement("div");
		d.appendChild(playerNameSpan(playername));
		d.appendChild(document.createTextNode(" guessed word "+word));
		logmsg(d);
	}

	/**
	 * This should be changed to true once the first player has joined the game.
	 */
	var got_first_player = false;

	/**
	 * Show the user that a new player has joined the game.
	 * @param newplayer String The name of the player that joined.
	 */
	m.onPlayerJoin = function (newplayer) {
		// When a user is playing a game locally, they have no name, so the
		// words they answer are credited under the variable `true`. This will
		// change it to the actual player name.
		if (!got_first_player) {
			var table_words = document.getElementsByClassName("word");

			for (var i = 0; i < table_words.length; i++) {
				if (table_words[i].guesser === true) {
					table_words[i].guesser = newplayer;
				}
			}
			got_first_player = true;
		}

		var playerAlreadyExists = false;
		for (var i = 0; i < players.length; i++) {
			if (players[i][0] === newplayer) {
				players[i][1] = true;
				playerAlreadyExists = true;

				var ul_playerul = document.getElementById("playerul");
				playerul.children[i].classList.remove("quit");
				
				break;
			}
		}
		if (!playerAlreadyExists) {
			players.push([newplayer, true]);

			// add this player to the list of players
			var li = document.createElement("li");
			li.appendChild(playerNameSpan(newplayer));

			var ul_playerul = document.getElementById("playerul");
			ul_playerul.appendChild(li);
		}

		// create the log message
		var d = document.createElement("div");
		d.appendChild(playerNameSpan(newplayer));
		var joined = playerAlreadyExists ? "rejoined" : "joined";
		d.appendChild(document.createTextNode(" has "+joined+" the game."));

		logmsg(d);

		resetColors();
	}

	/**
	 * Should be called when a player leaves the game.
	 *
	 * @param playername String The name of the player who quit.
	 */
	m.onPlayerQuit = function (playername) {
		for (var i = 0; i < players.length; i++) {
			if (players[i][0] === playername) {
				players[i][1] = false;

				var ul_playerul = document.getElementById("playerul");
				console.log(playerul.children[i]);
				playerul.children[i].classList.add("quit");

				break;
			}
		}

		// create the log message
		var d = document.createElement("div");
		d.appendChild(playerNameSpan(playername));
		d.appendChild(document.createTextNode(" has quit the game."));

		logmsg(d);
	}

	/**
	 * Show a certain stage of multiplayer menu.
	 *
	 * -1 - Show nothing
	 *  0 - The "share" button
	 *  1 - The player name entry box
	 *  2 - The main multiplayer screen with all game info
	 *
	 * @param n Number The stage to show.
	 */
	m.show_mp_menu = function (n) {
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

		// If the user is in a multiplayer game, disable the "give up" button.
		if (n == 2) {
			document.getElementById("b-giveup").style.display = "none";
		}
	}

	/**
	 * Display on the screen a shareable URL for a game
	 *
	 * @param gamename String The name of the game to show
	 */
	m.display_gamename = function (gamename) {
		document.getElementById("input-sharelink").value =
				document.URL.split("#",1)[0] + "#"+gamename;
	}

	return m;
}());
