/*
Verbose Expressions
===================
Authors:
Rupesh Kumar Srivastava (github.com/flukeskywalker)
Nihat Engin Toklu (github.com/engintoklu)
*/
"use strict";

function isWhitespace(c)
{
    return (c == " " || c == "\t" || c == "\n" || c == "\r");
}

function tokenize(str)
{
    var result = [];

    var quotation = "";
    var word = "";

    function addWord()
    {
        if (word.length > 0)
        {
            result.push(word);
            word = "";
        }
    }

    for (var i = 0; i < str.length; i++)
    {
        var c = str[i];
        var cnext;

        if (i < (str.length - 1))
        {
            cnext = str[i + 1];
        }
        else
        {
            cnext = "";
        }

        if (quotation.length > 0)
        {
            if (c == quotation)
            {
                if (cnext == c)
                {
                    word += c;
                    i += 1; // skip the next char
                }
                else
                {
                    word += c;
                    addWord();
                    quotation = "";
                }
            }
            else
            {
                word += c;
            }
        }
        else
        {
            if (isWhitespace(c))
            {
                addWord();
            }
            else if (c == "'" || c == '"')
            {
                addWord();
                quotation = c;
                word = c;
            }
            else if (c == "(" || c == ")")
            {
                addWord();
                word = c;
                addWord();
            }
            else
            {
                word += c;
            }
        }
    }
    addWord();

    return result;
}

var VerbexElementType = {literal:0, command:1};

function VerbexElement()
{
    this.type = VerbexElementType.literal;
    this.value = "";
    this.args = [];
}
VerbexElement.prototype.makeString = function() {
    if (this.args.length > 0)
    {
        var s = " ";
        for (var i in this.args)
        {
            s += this.args[i].makeString();
        }

        return "{" + this.type + " " + this.value + " :" + s + "}";
    }
    else
    {
        return "{" + this.type + " " + this.value + "}";
    }
}

function represent(tokenized)
{
    var result = new VerbexElement();
    result.type = VerbexElementType.command;
    result.value = tokenized[0];

    var subexp = [];

    var depth = 0;
    for (var i = 1; i < tokenized.length; i++)
    {
        var token = tokenized[i];

        if (token == "(")
        {
            if (depth >= 1)
            {
                subexp.push("(");
            }
            depth += 1;
        }
        else if (token == ")")
        {
            depth -= 1;
            if (depth == 0)
            {
                result.args.push(represent(subexp));
                subexp = [];
            }
            else if (depth >= 1)
            {
                subexp.push(")");
            }
        }
        else if (depth > 0)
        {
            subexp.push(token);
        }
        else
        {
            var o;
            o = new VerbexElement();

            var firstchar;
            firstchar = token.substring(0, 1);

            if (firstchar == "'" || firstchar == '"')
            {
                token = token.substring(1, token.length - 1);
                o.type = VerbexElementType.literal;
            }
            else
            {
                o.type = VerbexElementType.command;
            }
            o.value = token;

            result.args.push(o);
        }
    }

    return result;
}

// ^ - begin
// $ - end
// . - any
// [] - IGNORE
// [^] - except
// [-] - range
// ? - optional    0-or-1    ?
// + - 1-or-more     +
// * - 0-or-more     *
// () - ()
// {n} - times n
// {n,} - mintimes n
// {n,m} - minmaxtimes n m
// | - or

var specialChars = "^$.[]-?+*(){}|\\";

function escapedLiteral(s)
{
    var result = "";
    for (var i = 0; i < s.length; i++)
    {
        var c = s[i];
        if (specialChars.indexOf(c) > -1)
        {
            result += "\\";
        }
        result += c;
    }
    return result;
}

function process(rep)
{
    var result = "";

    function joinArgs(sep, starti)
    {
        for (var i = starti; i < rep.args.length; i++)
        {
            var arg = rep.args[i];
            if (i > starti)
            {
                result += sep;
            }
            result += process(arg);
        }
    }

    if (rep.type == VerbexElementType.command)
    {
        var cmd = rep.value;
        if (cmd == "match")
        {
            joinArgs("", 0);
        }
        else if (cmd == "begin")
        {
            result += "^";
        }
        else if (cmd == "end")
        {
            result += "$";
        }
        else if (cmd == "anychar" || cmd == ".")
        {
            result += ".";
        }
        else if (cmd == "except")
        {
            result += "[^";
            joinArgs("", 0);
            result += "]";
        }
        else if (cmd == "range")
        {
            result += "[";
            joinArgs("-", 0);
            result += "]";
        }
        else if (cmd == "optional" || cmd == "0-or-1" || cmd == "?")
        {
            result += "(";
            joinArgs("", 0);
            result += ")?";
        }
        else if (cmd == "1-or-more" || cmd == "+")
        {
            result += "(";
            joinArgs("", 0);
            result += ")+";
        }
        else if (cmd == "0-or-more" || cmd == "*")
        {
            result += "(";
            joinArgs("", 0);
            result += ")*";
        }
        else if (cmd == "or" || cmd == "|")
        {
            result += "(";
            joinArgs("|", 0);
            result += ")";
        }
        else if (cmd == "times")
        {
            var n;
            n = rep.args[0].value;
            joinArgs("", 1);
            result += "{" + n + "}";
        }
        else if (cmd == "mintimes")
        {
            var n;
            n = rep.args[0].value;
            joinArgs("", 1);
            result += "{" + n + ",}";
        }
        else if (cmd == "minmaxtimes")
        {
            var n;
            n = rep.args[0].value;
            var m;
            m = rep.args[1].value;
            joinArgs("", 2);
            result += "{" + n + "," + m + "}";
        }


    }
    else if (rep.type == VerbexElementType.literal)
    {
        result = escapedLiteral(rep.value);
    }

    return result;
}

function button1_click()
{
    var f = document.form1;
    var arr = tokenize("match " + f.area1.value);
    var rep = represent(arr);

    //var result = "";
    //for (var token in arr)
    //{
    //    result += arr[token] + "\n";
    //}

    //f.area2.value = result;

    //f.area2.value = represent(arr).makeString();

    f.area2.value = process(rep);
}

function button2_click()
{
    var f1 = document.form1;
    var f2 = document.form2;
    var re = new RegExp(f1.area2.value);
    var a = re.exec(f2.area3.value);
    if (a != null)
    {
        var i = a.index;
        var s = a[0];
        f2.text1.value = i + " " + s;
    }
    else
    {
        f2.text1.value = "[No match]";
    }

}

