from collections import Counter
import fileinput
import os

MIN_WORDS = 23

DIR_NAME = 'levels'

f = open('words.txt')
words = [l.rstrip() for l in f]
f.close()

counter = 0

if not os.path.exists(DIR_NAME):
    os.makedirs(DIR_NAME)

for lw in words:
    if len(lw) == 6:
        level_count = 0
        level_words = ''
        for w in words:
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
