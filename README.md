# SixLetters
SixLetters is an anagram game, inspired by Text Twist. Given six letters,
attempt to form as many words as possible.  A live demo is available at
https://dkess.me/sixletters ([backup link](https://www.ocf.berkeley.edu/~dkessler/sixletters/)).

## Pre-caching levels
By default, to generate a level, clients will download the entire word list, pick a random 6 letter word, and fill in the remaining words based on anagrams. This process is slow and consumes excessive bandwidth. As an alternative, the `expand.py` python script can be run to pre-cache each level in the `levels` directory. This process generates 1366 levels, consumes 4.3M of disk space, and takes ~30 seconds when run with PyPy.

You can also set extra options when pre-caching levels. Run `expand.py --help` to see all of them. For example, if you are interested in excluding obscene words, you can download [this list](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/blob/master/en) and use the file as an argument.

```
python expand.py -b <(curl https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en)
```


## Multiplayer
You can play SixLetters cooperatively with your friends! Just press the "Share Game" button to host, and share the link. The server is written in Python and its [source](https://github.com/dkess/sl_gameserver) is on GitHub. Competitive multiplayer is coming soon!
