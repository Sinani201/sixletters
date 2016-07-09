# SixLetters
SixLetters is an anagram game, inspired by Text Twist. Given six letters,
attempt to form as many words as possible.  A live demo is available at
https://dkess.me/sixletters ([backup link](https://www.ocf.berkeley.edu/~dkessler/sixletters/)).

## Pre-caching levels
By default, to generate a level, clients will download the entire word list, pick a random 6 letter word, and fill in the remaining words based on anagrams. This process is slow and consumes excessive bandwidth. As an alternative, the `expand.py` python script can be run to pre-cache each level in the `levels` directory. This process consumes 4.3M of disk space, and takes ~30 seconds when run with PyPy.

## Multiplayer
You can play SixLetters cooperatively with your friends! Just press the "Share Game" button to host, and share the link. The server is written in Python and its [source](https://github.com/dkess/sl_gameserver) is on GitHub. Competitive multiplayer is coming soon!
