from collections import Counter
import fileinput
import argparse
import os

parser = argparse.ArgumentParser(
    description='Pre-caches every SixLetters level.',
    formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument('-w', '--wordsfile', default='words.txt', type=open,
                    help='The file with words to use')
parser.add_argument('-l', '--levelsdir', default='levels',
                    help=('The directory to store the levels in. Will be created'
                          ' if it does not exist already.'))
parser.add_argument('-c', '--min-words', default=23, type=int,
                    help='The minimum amount of words a level can have.')
parser.add_argument('-b', '--badwords', type=open,
                    help='A list of bad words to exclude from all levels')
parser.add_argument('--dry-run', action='store_true',
                    help='Do not actually write to filesystem')

args = parser.parse_args()

MIN_WORDS = args.min_words
DIR_NAME = args.levelsdir

badwords = set()
if args.badwords:
    badwords = set(w.rstrip().lower() for w in args.badwords
                   if 3 <= len(w.rstrip()) <= 6)

f = args.wordsfile
words = [l.rstrip().lower() for l in f if l.rstrip().lower() not in badwords]
f.close()

# dictionary of 6-letter words that have already been used in another level
# this prevents duplicate levels with multiple 6-letter words
used_bigwords = set()

counter = 0

if not args.dry_run and not os.path.exists(DIR_NAME):
    os.makedirs(DIR_NAME)

for lw in words:
    if len(lw) == 6 and lw not in used_bigwords:
        level_count = 0
        level_words = ''
        lw_c = Counter(lw)
        for w in words:
            w_c = Counter(w)
            valid_anagram = True
            for c, num in w_c.items():
                if num > lw_c[c]:
                    valid_anagram = False
                    break
            if valid_anagram:
                if len(w) == 6 and w != lw:
                    used_bigwords.add(w)
                level_count += 1
                level_words += w + '\n'
        if level_count >= MIN_WORDS:
            if not args.dry_run:
                with open('{}/{:0>4}.txt'.format(DIR_NAME, counter), 'w') as f:
                    f.write(level_words)
            counter += 1

print('// Put this in your config.js file:')
print('var LEVELS_COUNT={};'.format(counter))
