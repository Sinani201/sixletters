# SixLetters
SixLetters is an anagram game, inspired by Text Twist. Given six letters,
attempt to form as many words as possible.  A live demo is available at
https://dkess.me/sixletters ([backup link](https://www.ocf.berkeley.edu/~dkessler/sixletters/)) ([backup link 2](https://dkess.github.io/sixletters/)).

## Pre-caching levels
By default, clients must download the entire word list on each page load to generate a level. This process is slow and consumes excessive bandwidth. As an alternative, the `expand.py` python script can be run to pre-cache every possible level. This script creates a `levels` directory and generates 1742 levels which consume 6.9M of disk space. The script takes ~30 seconds when run with PyPy or 3-4 minutes when run with CPython on a modern computer. If this is too slow, you can use the alternate Rust version, which runs in less than a second: `rustc -O expand.rs && ./expand`.

Pre-caching levels also allows for extra options. You can blacklist obscene words, set the minimum amount of words per level (to prevent very small levels from appearing). Run `expand.py --help` to see all options. Both expand.py ad expand.rs take the same options.

## Multiplayer
You can play SixLetters cooperatively with your friends! Press the "Play Co-op" button to generate a link that you can send to anyone. The server is written in Erlang and its [source](https://github.com/dkess/slserver) is on GitHub. Competitive multiplayer is coming soon!
