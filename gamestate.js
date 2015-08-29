var GAMESTATE = (function() {
	var m = {};

	/**
	 * Shuffles an array in-place and returns it.
	 * @param array Array the array to shuffle
	 * @return Array the shuffled array.
	 */
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
		return uniq_fast(permute(list).map(function(l) {
			return l.slice(0, maxLen);
		}));
	}

	/**
	 * A array of word groups.  Each word group is an array of [a, b] pairs,
	 * where a is a lower-case correct word (String), and b is the player who
	 * answered it (or false if it has not been answered yet)
	 */
	var answers;

	/**
	 * An array of lower-case characters, representing the currently available
	 * letters theuser can select to make a word from.
	 */
	var avail_letters;

	/**
	 * An array of lower-case characters, representing the word that the user is
	 * guessing.
	 */
	var input_box;

	m.shuffleLetters = function () {
		shuffle(avail_letters);
		UI.initChoices(avail_letters);
	}

	/**
	 * Starts a game and sets everything up in the UI.
	 * @param dictionary Array A full dictionary of words.
	 */
	m.createGame = function (dictionary) {
		var dictionary = dictionary.map(function (a) {
			return a.toLowerCase();
		});
		// pick a random 6 letter word
		var possibilities = dictionary.filter(function(s) { return s.length === 6});
		var baseWord = possibilities[
				Math.floor(Math.random() * possibilities.length)]
				.toLowerCase().split("");

		var gamewords = [];
		for (var i = 3; i <= 6; i++) {
			var ss = getUniqPermutations(baseWord, i).map(function(a) {
				return a.join(""); }).filter( function(s) {
					return dictionary.indexOf(s) > -1
				}).sort();

			gamewords.push(ss);
		}

		UI.constructGame(gamewords);

		answers = gamewords.map(function(a) { return a.map(function(b) {
			return [b, false];
		})});

		avail_letters = baseWord.slice(0);
		m.shuffleLetters();

		input_box = [];
	}

	/**
	 * Gives a triple containing the location of this word in relation to all
	 * others, or null if the word is not in the game.
	 * @param word String The word to check.
	 * @return Array A triple [a,b,c] where `a` is the group index of the word,
	 * 				 `b` is the index of the word inside the group, and `c` is
	 * 				 the player that guessed this word, or false if no one has
	 * 				 yet guessed it. Returns null if the word is incorrect.
	 */
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

	/**
	 * Reveals a word and credits it under `playername`, if it is correct.
	 *
	 * @param word String The word that was guessed.
	 * @param playername String The player that guessed this word, or true if
	 *                          it was guessed by the local player, not in a
	 *                          multiplayer round.
	 */
	m.onWordGuess = function (word, playername) {
		var a = checkWord(word);
		if (a) {
			if (a[2]) {
				// TODO: tell the user that this word has already been guessed
			} else {
				UI.revealWord(word, a[0], a[1], playername);
				answers[a[0]][a[1]][1] = playername;
			}
		}
	}

	/**
	 * Pops the last element of the `input_box` array, and transfers it to the
	 * last available empty slot in `avail_letters`.
	 *
	 * @return Boolean False if there was nothing to backspace, otherwise true.
	 */
	m.backspaceChar = function () {
		if (input_box.length > 0) {
			var c = input_box.pop();
			UI.backspaceChar();

			avail_letters[avail_letters.lastIndexOf("")] = c;
			UI.addToChoices(c);
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Submit the currently entered word, clearing the input box and revealing
	 * the word in the finished words section if needed.
	 */
	m.submitWord = function () {
		var word = input_box.join("");
		var playername = MULTIPLAYER.getPlayername();
		// If the user is not in a multiplayer game, the "default" name is just the
		// value `true`.
		if (!playername) {
			playername = true;
		}

		m.onWordGuess(word, playername);
		MULTIPLAYER.announceWordGuess(word);
		
		while (m.backspaceChar());
	}

	/** Automatically guesses every correct word. */
	m.revealAll = function () {
		// Disable hosting multiplayer
		UI.show_mp_menu(-1);

		for (var i = 0; i < answers.length; i++) {
			for (var j = 0; j < answers[i].length; j++) {
				UI.revealWord(answers[i][j][0], i, j, 1);
			}
		}
	}

	/**
	 * Checks if a letter is available to be typed.
	 *
	 * @param c The letter to check.  Not case sensitive.
	 * @return Number The index of the letter in the list of available letters,
	 *                or -1 if this letter is not available.
	 */
	m.indexOfLetter = function (c) {
		return avail_letters.indexOf(c.toLowerCase());
	}

	/**
	 * Enters a letter to the input box, and removes it from the list of
	 * available letters.
	 *
	 * @param index Number The index of the letter in the `avail_letters` array
	 * 					   to enter.
	 * @return Boolean False if there was no letter at this index, otherwise
	 *                 returns true.
	 */
	m.enterChar = function (index) {
		var c = avail_letters[index];
		if (c) {
			input_box.push(c);
			UI.enterChar(c);

			avail_letters[index] = "";
			UI.removeLetterAtIndex(index);

			return true;
		} else {
			return false;
		}
	}

	/**
	 * Generate the Object of multiplayer callback functions.
	 *
	 * @param onGameMake Function The function to call once the game has been
	 *                            created. Optional.
	 */
	function mp_callbacks(onGameMake) {
		if (typeof onGameMake === 'undefined') { onGameMake = function () {}; }

		return {
			onLobbyCreate: function (lobbyname) {
				UI.display_gamename(lobbyname);
				UI.show_mp_menu(2);
				onGameMake();
			},
			onPlayerQuit: UI.onPlayerQuit,
			onPlayerJoin: UI.onPlayerJoin,
			onWordAttempt: m.onWordGuess,
			makeGame: function (gamewords) {
				m.createGame(gamewords);
				UI.show_mp_menu(2);
				onGameMake();
			}
		};
	}

	/**
	 * Host a new multiplayer game.
	 *
	 * @param name String The name of whoever is hosting.
	 */
	m.hostGame = function (name) {
		MULTIPLAYER.hostGame(name, answers, mp_callbacks());
	}

	/**
	 * Set the name of this player.  Should only be called while in the process
	 * of joining a game.
	 *
	 * @param name String The name to choose.
	 */
	m.sendName = MULTIPLAYER.sendName;

	/**
	 * Join an already existing multiplayer game.
	 *
	 * @param lobbyname String The name of the game to join
	 * @param callback Function A function to call after the game has been
	 *                          created.
	 */
	m.joinGame = function (lobbyname, callback) {
		MULTIPLAYER.joinGame(lobbyname, mp_callbacks(callback));
	}

	return m;
}());
