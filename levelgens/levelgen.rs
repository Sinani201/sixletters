use std::collections::HashSet;
use std::env;
use std::fs;
use std::fs::File;
use std::io::{BufRead, BufReader, Write};
use std::path::Path;

struct WordData {
    word: String,
    sorted: String
}

/// Checks if the letters of small can be formed from the letters of big.
/// Both arguments should be sorted.
fn is_subgram(small: &String, big: &String) -> bool {
    let mut big_iter = big.bytes();
    let mut big_on = big_iter.next().unwrap();

    let mut small_iter = small.bytes();
    let mut small_on = small_iter.next().unwrap();

    loop {
        if small_on < big_on {
            return false;
        } else if small_on == big_on {
            small_on = match small_iter.next() {
                Some(x) => x,
                None => return true,
            };
        }
        big_on = match big_iter.next() {
            Some(x) => x,
            None => return false,
        };
    }
}

fn main() {
    // Parse command-line args
    let mut last_arg = String::from("");

    // defaults
    let mut wordsfile = String::from("dist/words.txt");
    let mut levelsdir = String::from("dist/levels");
    let mut min_words = 20;
    let mut badwordsfile = String::from("");
    let mut dryrun = false;

    for arg in env::args().skip(1) {
        if last_arg == "" {
            if arg == "--dry-run" {
                dryrun = true;
            } if arg == "-h" || arg == "--help" {
                println!(
r#"usage: {} [-h] [-w WORDSFILE] [-l LEVELSDIR] [-c MIN_WORDS]
                 [-b BADWORDS] [--dry-run]

Pre-caches every SixLetters level.

optional arguments:
  -h, --help            show this help message and exit
  -w WORDSFILE, --wordsfile WORDSFILE
                        The file with words to use (default: dist/words.txt)
  -l LEVELSDIR, --levelsdir LEVELSDIR
                        The directory to store the levels in. Will be created
                        if it does not exist already. (default: dist/levels)
  -c MIN_WORDS, --min-words MIN_WORDS
                        The minimum amount of words a level can have.
                        (default: 20)
  -b BADWORDS, --badwords BADWORDS
                        A list of bad words to exclude from all levels
                        (default: None)
  --dry-run             Do not actually write to filesystem (default: False)"#,
                    env::args().nth(0).unwrap());
                return;
            } else {
                last_arg = arg;
            }
        } else {
            if last_arg == "-w" || last_arg == "--wordsfile" {
                wordsfile = arg;
            } else if last_arg == "-l" || last_arg == "--levelsdir" {
                levelsdir = arg;
            } else if last_arg == "-c" || last_arg == "--min-words" {
                min_words = arg.parse::<usize>().unwrap();
            } else if last_arg == "-b" || last_arg == "--badwords" {
                badwordsfile = arg;
            }
            last_arg = String::from("");
        }
    }

    let badwords = if badwordsfile != "" {
        let bwf = File::open(badwordsfile).unwrap();
        let bwf = BufReader::new(bwf);

        bwf.lines()
            .filter_map(|x| {
                let x = x.unwrap();
                if x.len() <= 6 {
                    Some(x.to_lowercase())
                } else {
                    None
                }})
            .collect::<HashSet<String>>()
    } else {
        HashSet::new()
    };

    let f = File::open(wordsfile).unwrap();
    let f = BufReader::new(f);

    let mut words = Vec::with_capacity(12000);
    let mut levels: Vec<String> = Vec::with_capacity(1400);
    
    for line in f.lines() {
        let word = line.unwrap().to_lowercase();
        if !badwords.contains(&word) {
            let mut a: Vec<u8> = word.bytes().collect();
            a.sort();
            let sorted = String::from_utf8(a).unwrap();

            if word.len() == 6 {
                if !levels.iter().any(|x| x == &sorted) {
                    levels.push(sorted.clone());
                }
            }

            let wd = WordData { word: word, sorted: sorted };
            words.push(wd);
        }
    }

    if !dryrun {
        fs::create_dir_all(&levelsdir).unwrap();
    }

    let mut level_counter = 0;

    for bigword in levels.into_iter() {
        let level_words =
            words.iter().filter_map(
                |x| -> Option<String> {
                    if is_subgram(&x.sorted, &bigword) {
                        Some(x.word.clone())
                    } else {
                        None
                    }
                }).collect::<Vec<String>>();

        if level_words.len() >= min_words {
            if !dryrun {
                let mut f = File::create(
                        Path::new(&levelsdir)
                        .join(format!("{:04}.txt", level_counter))).unwrap();

                for w in level_words.into_iter() {
                    write!(f, "{}\n", w).unwrap();
                }
            }

            level_counter += 1;
        }
    }

    println!("// Put this in your config.js file:");
    println!("var LEVELS_COUNT={};", level_counter);
}
