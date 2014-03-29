#VerbEx 
##a.k.a. Verbose Expressions

VerbEx is regex for the rest of us. 
It brings the power of regular expressions to everyone who can not remember the often abstract symbolism of various regex syntaxes. It provides an intuitive, expressive, general and easy to use regex syntax which is then converted to many desired regex syntaxes (GNU, Python, Vim). No need to memorise them all!

## Keywords:
For many expressions, the GNU symbols are also valid in verbex, in case you remember them too well.

`match` -- match an expression (a sequence of patterns)

`begin` -- match beginning of line or string (GNU: `^`)

`end` -- match end of line of string (GNU: `^`)

`anychar` -- match a single occurance of any character (GNU: `.`)

`except` -- match any characters except the given ones

`range` -- match characters in given range of alphabets or digits

`optional` or `zero-or-one`  -- given expression will match if present once or absent  (GNU: `?`)

`one-or-more` -- given expression will match if present once or more (GNU: `+`)

`zero-or-more` -- given expression may or may not be present (GNU: `*`)

`or` -- match any of the given expression (GNU: `|`)

`times` -- match the given expression a fixed (given) number of times
 
`mintimes` -- match the given expression a minimum (given) number of times

`minmaxtimes` -- match the given expression between a minimum (given) and
maximum (given) number of times

## Authors

Rupesh Kumar Srivastava (github.com/flukeskywalker)
Nihat Engin Toklu (github.com/engintoklu)

## License

VerbEx is licensed under the MIT license. 
See the file LICENSE for more details.