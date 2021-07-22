# SixLetters
SixLetters is an anagram game, inspired by Text Twist. Given six letters,
attempt to form as many words as possible. You can play it now by visiting
https://dkess.me/sixletters ([backup 
link](https://www.ocf.berkeley.edu/~dkessler/sixletters/)) ([backup link 
2](https://dkess.github.io/sixletters/)).

## Pre-caching levels
By default, clients must download the entire word list on each page load to 
generate a level. This process is slow and consumes excessive bandwidth. As an 
alternative, you can run `python levelgens/levelgen.py` to pre-cache every 
possible level. This script creates a `levels` directory and generates 2294
levels which consume 7.2M of disk space. The script takes ~30 seconds when run 
with PyPy or 3-4 minutes when run with CPython on a modern computer.

If this is too slow, you can use the alternate Rust version, which runs in less 
than a second (on a modern computer): `rustc -O levelgens/levelgen.rs && 
./levelgen`. If you are on a computer with multiple cores, you can possibly get 
even greater speed gains by using the multithreading version: `rustc -O 
levelgens/levelgen_multithread.rs && ./levelgen_multithread --workers NUM` 
where NUM is how many worker threads to use.

Pre-caching levels also allows for extra options. You can blacklist obscene 
words, set the minimum amount of words per level (to prevent very small levels 
from appearing). Run `python levelgens/levelgen.py --help` to see all options. 
Both the Python and Rust versions take the same options.

## Multiplayer
You can play SixLetters cooperatively with your friends! Press the "Play Co-op" 
button to generate a link that you can send to anyone. The server is written in 
Go and its [source](https://github.com/dkess/go_slserver) is on GitHub. 
Competitive multiplayer is coming soon!
