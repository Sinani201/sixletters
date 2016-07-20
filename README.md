# SixLetters
SixLetters is an anagram game, inspired by Text Twist. Given six letters,
attempt to form as many words as possible.  A live demo is available at
https://dkess.me/sixletters ([backup link](https://www.ocf.berkeley.edu/~dkessler/sixletters/)) ([backup link 2](https://dkess.github.io/sixletters/)).

## Pre-caching levels
By default, clients must download the entire word list on each page load to generate a level. This process is slow and consumes excessive bandwidth. As an alternative, the `expand.py` python script can be run to pre-cache each level in the `levels` directory. This process generates 1742 levels, consumes 4.3M of disk space, and takes ~30 seconds when run with PyPy or 3-4 minutes when run with CPython. If this is too slow, you can use the alternate Rust version, which runs in less than a second: `rustc -O expand.rs && ./expand`.

Pre-caching levels also allows for extra options. You can blacklist obscene words, set the minimum amount of words per level (to prevent very small levels from appearing). Run `expand.py --help` to see all options. Both expand.py ad expand.rs take the same options.

## Multiplayer
You can play SixLetters cooperatively with your friends! Just press the "Share Game" button to host, and share the link. The server is written in Python and its [source](https://github.com/dkess/sl_gameserver) is on GitHub. Competitive multiplayer is coming soon!
