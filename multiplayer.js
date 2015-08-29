/**y 
 * When in a multiplayer game, this module communicates with gamestate.js
 * through a set of callback functions.  These functions should be implemented:
 *
 * onLobbyCreate(String lobbyname)
 * Only necessary for hosting.  Will be called once the multiplayer game has
 * been registered server-side and is ready to accept new players to join.
 *
 * onPlayerJoin(String name)
 * Will be called if a player joins the game.
 *
 * onPlayerQuit(String name)
 * Will be called if a player quits the game.
 *
 * onWordAttempt(String word, String playername)
 * Will be called whenever a player guesses a word.
 *
 * makeGame(Array gamewords)
 * Only necessary for joining an already existing game.  After joining, this
 * function will be called with the array of every word in the game.
 */
var MULTIPLAYER = (function() {
	var m = {};

	var serverurl = "ws://127.0.0.1:443/";

	function split(s, separator, limit) {
	  // split the initial string using limit
	  var arr = s.split(separator, limit);
	  // get the rest of the string...
	  var left = s.substring(arr.join(separator).length + separator.length);
	  // and append it to the array
	  arr.push(left);
	  return arr;
	}

	var sock;
	var playername;
	var callbacks;

	// the list of players in this game
	var players = [];

	/**
	 * Get the name of the local player.
	 *
	 * @return String The name of the local player, or null if there is no game
	 *                running.
	 */
	m.getPlayername = function () {
		return playername;
	}

	/**
	 * Should be called whenever a new player joins the game
	 * 
	 * @param name String The name of whoever joined
	 */
	function onPlayerJoin(name) {
		callbacks.onPlayerJoin(name);

		players.push(name);
	}

	/**
	 * Should be called whenever a player quits the game
	 *
	 * @param name String The name of whoever quit
	 */
	function onPlayerQuit(name) {
		callbacks.onPlayerQuit(name);

		players.splice(players.indexOf(name), 1);
	}

	function onServerMsg(event) {
		console.log(">"+event.data);
		var attempt_command = ":attempt ";
		if (event.data.substring(0, attempt_command.length) === attempt_command) {
			sdata = split(event.data, " ", 2);
			callbacks.onWordAttempt(sdata[1], sdata[2]);
		} else {
			var sdata = split(event.data, " ", 1);
			if (sdata[0] === ":join") {
				onPlayerJoin(sdata[1]);
			} else if (sdata[0] === ":quit") {
				onPlayerQuit(sdata[1]);
			}
		}
	}

	/**
	 * Announce to the server that the player has guessed a word.
	 *
	 * @param word String The word that was guessed.  Not case sensitive.
	 */
	m.announceWordGuess = function (word) {
		if (sock) {
			sock.send(":attempt "+word.toLowerCase());
		}
	}

	/**
	 * Creates a connection to the game server and begins hosting a game.
	 *
	 * The answers variable will be modified.  Each word that has already been
	 * guessed will be credited to the playername of this local player, rather
	 * than the default `true` value.
	 *
	 * @param name String The name of whoever is hosting
	 * @param answers String A list of word groups containing every word in the
	 * 						 game. Each "word" should actually be a triple, as
	 * 						 described in GAMESTATE#answers.
	 * @param cbacks Object An object with callback functions.  Should have the
	 *                      following callbacks:
	 *                      onLobbyCreate, onPlayerJoin, onWordAttempt
	 */
	m.hostGame = function (name, answers, cbacks) {
		console.log(answers);
		sock = new WebSocket(serverurl);
		playername = name;
		callbacks = cbacks;

		sock.onopen = function (event) {
			sock.send(":host "+name);

			for (var i = 0; i < answers.length; i++) {
				for (var j = 0; j < answers[i].length; j++) {
					// Should be " y" if this word has already been guessed,
					// otherwise " n".
					var wordGuessStatus = " n";
					if (answers[i][j][1]) {
						answers[i][j][1] = m.getPlayername();
						wordGuessStatus = " y";
					}

					sock.send(answers[i][j][0] + wordGuessStatus);
				}
			}

			sock.send(":endwords");
		};

		sock.onmessage = function (event) {
			// TODO: if the socket closes itself instead of sending a message,
			// do something
			callbacks.onLobbyCreate(event.data);
			onPlayerJoin(name);
			sock.onmessage = onServerMsg;
		};
	}

	/**
	 * Set the name of this player.  Should only be called while in the process
	 * of joining a game.
	 *
	 * @param name String The name to choose.
	 */
	m.sendName = function (name) {
		playername = name;
		sock.send(name);
	}

	/**
	 * Creates a connection to the game server and joins an existing game.
	 *
	 * @param lobbyname String The name of the game to join
	 * @param cbacks Object An object with callback functions.  Should have the
	 *                      following callbacks:
	 *                      makeGame, onPlayerJoin, onWordAttempt
	 */
	m.joinGame = function (lobbyname, cbacks) {
		sock = new WebSocket(serverurl);
		callbacks = cbacks;

		var state = 0;
		var sent_words = [];

		sock.onopen = function (event) {
			sock.send(":join "+lobbyname);
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
				sdata = split(event.data, " ", 2);
				if (sdata[0] === ":player") {
					onPlayerJoin(sdata[2]);
					if (sdata[1] === "n") {
						onPlayerQuit(sdata[2]);
					}
				} else if (sdata[0] === ":endplayers") {
					state = 2;
					mp_sock = sock;
				}
			} else if (state === 2) {
				if (event.data === ":badname") {
					// TODO: display this error to the user
					console.log("error: bad name");
				} else {
					onPlayerJoin(playername);
					state = 3;
				}
			}
			if (state === 3) {
				word = event.data.split(" ", 1)[0];
				if (word !== ":endwords") {
					sent_words.push(word);
				} else {
					callbacks.makeGame(sent_words);
					sock.onmessage = onServerMsg;
				}
			}
		};
	}

	return m;
}());nisani.bot.nu
