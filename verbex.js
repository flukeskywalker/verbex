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

function looksLikeInteger(s)
{
    var p = new RegExp('^[0-9]+$');
    return p.test(s);
}

function verifyItLooksLikeInteger(s, msgifnot)
{
    if (!looksLikeInteger(s))
    {
        throw msgifnot;
    }
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
            else if (c == "(" || c == ")" || c == "[" || c == "]")
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

    if (quotation != "")
    {
        throw "Unfinished quotation";
    }

    addWord();

    return result;
}

var VEElementType = {literal:0, command:1};

function VEElement()
{
    this.type = VEElementType.literal;
    this.value = "";
    this.args = [];
}
VEElement.prototype.makeString = function() {
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
VEElement.prototype.verifyArgCount = function(argcount, cmdname) {
    if (this.args.length != argcount)
    {
        throw "The command '" + cmdname + "' expects " + argcount + " number of arguments, but has encountered " + this.args.length + " number of arguments";
    }
}

VEElement.prototype.verifyMinArgCount = function(argcount, cmdname) {
    if (this.args.length < argcount)
    {
        throw "The command '" + cmdname + "' expects at least " + argcount + " number of arguments, but has encountered " + this.args.length + " number of arguments";
    }
}

function represent(tokenized)
{
    var result = new VEElement();
    result.type = VEElementType.command;
    result.value = tokenized[0];

    var subexp = [];
    var bracketStack = [];

    var depth = 0;
    for (var i = 1; i < tokenized.length; i++)
    {
        var token = tokenized[i];

        if (token == "(" || token == "[")
        {
            bracketStack.push(token);
            if (depth >= 1)
            {
                subexp.push("(");
            }

            if (token == "[")
            {
                subexp.push("match");
            }

            depth += 1;
        }
        else if (token == ")" || token == "]")
        {
            var popped;
            var bracketOk = false;

            if (bracketStack.length == 0)
            {
                throw "Mismatched parentheses";
            }

            popped = bracketStack.pop();

            if (popped == "(" && token == ")")
            {
                bracketOk = true;
            }
            else if (popped == "[" && token == "]")
            {
                bracketOk = true;
            }

            if (!bracketOk)
            {
                throw "Mismatched parentheses";
            }

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
            o = new VEElement();

            var firstchar;
            firstchar = token.substring(0, 1);

            if (firstchar == "'" || firstchar == '"')
            {
                token = token.substring(1, token.length - 1);
                o.type = VEElementType.literal;
            }
            else
            {
                o.type = VEElementType.command;
            }
            o.value = token;

            result.args.push(o);
        }
    }

    if (bracketStack.length != 0)
    {
        throw "Unfinished expression";
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

    if (rep.type == VEElementType.command)
    {
        var cmd = rep.value;
        if (cmd == "match")
        {
            joinArgs("", 0);
        }
        else if (cmd == "group")
        {
            result += "(";
            joinArgs("", 0);
            result += ")";
        }
        else if (cmd == "refer")
        {
            verifyItLooksLikeInteger(rep.args[0].value, "an integer must be specified as the first argument of 'refer', but '" + rep.args[0].value + "' was encountered.");
            rep.verifyArgCount(1, cmd);
            result += "\\" + rep.args[0].value;
        }
        else if (cmd == "begin" || cmd == "^")
        {
            rep.verifyArgCount(0, cmd);
            result += "^";
        }
        else if (cmd == "end" || cmd == "$")
        {
            rep.verifyArgCount(0, cmd);
            result += "$";
        }
        else if (cmd == "\\n" || cmd == "\\r" || cmd == "\\t")
        {
            rep.verifyArgCount(0, cmd);
            result += cmd;
        }
        else if (cmd == "anychar" || cmd == ".")
        {
            rep.verifyArgCount(0, cmd);
            result += ".";
        }
        else if (cmd == "except")
        {
            rep.verifyMinArgCount(1, cmd);
            result += "[^";
            joinArgs("", 0);
            result += "]";
        }
        else if (cmd == "range")
        {
            rep.verifyArgCount(2, cmd);
            result += "[";
            joinArgs("-", 0);
            result += "]";
        }
        else if (cmd == "optional" || cmd == "zero-or-one" || cmd == "?")
        {
            rep.verifyMinArgCount(1, cmd);
            result += "(?:";
            joinArgs("", 0);
            result += ")?";
        }
        else if (cmd == "one-or-more" || cmd == "+")
        {
            rep.verifyMinArgCount(1, cmd);
            result += "(?:";
            joinArgs("", 0);
            result += ")+";
        }
        else if (cmd == "zero-or-more" || cmd == "*")
        {
            rep.verifyMinArgCount(1, cmd);
            result += "(?:";
            joinArgs("", 0);
            result += ")*";
        }
        else if (cmd == "or" || cmd == "|")
        {
            rep.verifyMinArgCount(1, cmd);
            result += "(?:";
            joinArgs("|", 0);
            result += ")";
        }
        else if (cmd == "times")
        {
            rep.verifyMinArgCount(2, cmd);
            var n;
            n = rep.args[0].value;
            verifyItLooksLikeInteger(n, "an integer must be specified as the first argument of 'times', but '" + n + "' was encountered.");
            joinArgs("", 1);
            result += "{" + n + "}";
        }
        else if (cmd == "mintimes")
        {
            rep.verifyMinArgCount(2, cmd);
            var n;
            n = rep.args[0].value;
            verifyItLooksLikeInteger(n, "an integer must be specified as the first argument of 'mintimes', but '" + n + "' was encountered.");
            joinArgs("", 1);
            result += "{" + n + ",}";
        }
        else if (cmd == "minmaxtimes")
        {
            rep.verifyMinArgCount(3, cmd);
            var n;
            n = rep.args[0].value;
            var m;
            m = rep.args[1].value;

            verifyItLooksLikeInteger(n, "an integer must be specified as the first argument of 'minmaxtimes', but '" + n + "' was encountered.");
            verifyItLooksLikeInteger(m, "an integer must be specified as the second argument of 'minmaxtimes', but '" + m + "' was encountered.");

            joinArgs("", 2);
            result += "{" + n + "," + m + "}";
        }
        else
        {
            throw "Unknown command: " + cmd;
        }


    }
    else if (rep.type == VEElementType.literal)
    {
        result = escapedLiteral(rep.value);
    }

    return result;
}

function button1_click()
{
    var f = document.form1;

    try
    {
        var arr = tokenize("match " + f.area1.value);
        var rep = represent(arr);

        //var result = "";
        //for (var token in arr)
        //{
        //    result += arr[token] + "\n";
        //}

        //f.area2.value = result;

        //f.area2.value = represent(arr).makeString();

        //f.area2.value = process(rep);

        f.area2.value = process(rep);
    }
    catch (e)
    {
        f.area2.value = "ERROR: " + e;
    }
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

