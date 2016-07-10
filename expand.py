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

args = parser.parse_args()

MIN_WORDS = args.min_words
DIR_NAME = args.levelsdir

f = args.wordsfile
words = [l.rstrip().lower() for l in f]
f.close()

badwords = set()
if args.badwords:
    badwords = set(w.rstrip().lower() for w in args.badwords
                   if 3 <= len(w.rstrip()) <= 6 and w.rstrip() in words)

counter = 0

if not os.path.exists(DIR_NAME):
    os.makedirs(DIR_NAME)

for lw in words:
    if len(lw) == 6:
        level_count = 0
        level_words = ''
        for w in words:
            if w in badwords:
                continue
            lw_c = Counter(lw)
            w_c = Counter(w)
            valid_anagram = True
            for c, num in w_c.items():
                if num > lw_c[c]:
                    valid_anagram = False
                    break
            if valid_anagram:
                level_count += 1
                level_words += w + '\n'
        if level_count >= MIN_WORDS:
            with open('{}/{:0>4}.txt'.format(DIR_NAME, counter), 'w') as f:
                f.write(level_words)
            counter += 1

print('// Put this in your config.js file:')
print('LEVELS_COUNT={};'.format(counter))
