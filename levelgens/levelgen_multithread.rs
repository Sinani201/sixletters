use std::collections::HashSet;
use std::collections::vec_deque::VecDeque;
use std::env;
use std::fs;
use std::fs::File;
use std::io::{BufRead, BufReader, Write};
use std::path::Path;
use std::sync::{Arc, Condvar, Mutex};
use std::thread;

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
            None => ('z' as u8) + 1,
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
    let mut workers_num = 2;

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
  --workers WORKERS     How many worker threads to use (default: 2)
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
            } else if last_arg == "--workers" {
                workers_num = arg.parse::<usize>().unwrap();
            }
            last_arg = String::from("");
        }
    }
    let levelsdir = levelsdir;
    let min_words = min_words;

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

    let levels = Arc::new(levels);
    let words = Arc::new(words);
    
    let next_index = Arc::new(Mutex::new(0));
    // First element of tuple: next level index in line to be written to disk
    // Second element of tuple: next level number
    // Third element of tuple: set of level numbers to skip
    let next_levelnum = Arc::new((Mutex::new((0, 0, HashSet::new())), Condvar::new()));

    let mut workers = vec![];
    for _ in 0..workers_num {
        let levelsdir = levelsdir.clone();

        let levels = levels.clone();
        let words = words.clone();
        let next_index = next_index.clone();
        let next_levelnum = next_levelnum.clone();

        workers.push(thread::spawn(move || {
            let mut processed_levels = VecDeque::new();
            'outer: loop {
                let currently_on = {
                    let mut next = next_index.lock().unwrap();
                    *next += 1;
                    *next - 1
                };

                let (discard, nothingleft) = match levels.get(currently_on) {
                    Some(bigword) => {
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
                            processed_levels.push_back((currently_on, level_words));
                            (false, false)
                        } else {
                            (true, false)
                        }
                    },
                    None => {
                        if processed_levels.is_empty() {
                            return;
                        }
                        (false, true)
                    },
                };

                let to_write = {
                    let &(ref lock, ref cvar) = &*next_levelnum;
                    let mut next_levelnum = lock.lock().unwrap();

                    if discard {
                        next_levelnum.2.insert(currently_on);
                    }

                    let mut to_write = Vec::new();
                    loop {
                        if next_levelnum.0 == currently_on
                                || Some(next_levelnum.0)
                                    == processed_levels.front().map(|x| x.0) {
                            loop {
                                let ni = next_levelnum.0;
                                if next_levelnum.2.remove(&ni) {
                                    next_levelnum.0 += 1;
                                } else if Some(ni)
                                        == processed_levels.front().map(|x| x.0) {
                                    let level = processed_levels.pop_front().unwrap().1;
                                    to_write.push((next_levelnum.1, level));
                                    next_levelnum.0 += 1;
                                    next_levelnum.1 += 1;
                                } else {
                                    break;
                                }
                            }
                            cvar.notify_all();
                            break;
                        } else {
                            if nothingleft {
                                next_levelnum = cvar.wait(next_levelnum).unwrap();
                            } else {
                                continue 'outer;
                            }
                        }
                    }
                    to_write
                };


                for (level_num, level_words) in to_write.into_iter() {
                    if !dryrun {
                        let mut f = File::create(
                          Path::new(&levelsdir)
                          .join(format!("{:04}.txt", level_num))).unwrap();

                        for w in level_words.into_iter() {
                            write!(f, "{}\n", w).unwrap();
                        }
                    }
                }
            }
        }));
    }

    for worker in workers {
        let _ = worker.join();
    }

    let next_levelnum = next_levelnum.0.lock().unwrap();
    println!("var LEVELS_COUNT={};", next_levelnum.1);
}
