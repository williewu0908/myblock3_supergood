// Import Blockly core.
import * as Blockly from 'blockly/core';
// Import the generator.
import { Order } from 'blockly/python';
import Sk from '@/components/blockly/blocks/skulpt_parser';

var CONSTRUCTOR_IMAGE_URL = /(?:^|\W)(Image\((["'])(.+?)\2\))/g;

var STRING_IMAGE_URL = /((["'])((?:blob:null\/[A-Fa-f0-9-]+)|(?:(?:https?:\/\/)?[\w.-]+(?:\.?[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+(?:png|jpg|jpeg|gif|svg)+)|(?:data:image\/(?:png|jpg|jpeg|gif|svg\+xml|webp|bmp)(?:;charset=utf-8)?;base64,(?:[A-Za-z0-9]|[+/])+={0,2}))\2)/g; //const CONSTRUCTOR_IMAGE_URL = /(?:^|\W)(Image\((["'])((?:blob:null\/[A-Fa-f0-9-]+)|(?:(?:https?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+(?:png|jpg|jpeg|gif|svg)+))\2\))/g;


const REGEX_PATTERNS = {
    "constructor": CONSTRUCTOR_IMAGE_URL,
    "string": STRING_IMAGE_URL,
    "none": false
};

export function BlockMirrorTextToBlocks(blockMirror) {
    this.blockMirror = blockMirror;
    this.hiddenImports = ["plt"];
    this.strictAnnotations = ['int', 'float', 'str', 'bool'];
    Blockly.common.defineBlocksWithJsonArray(BlockMirrorTextToBlocks.BLOCKS);
}

BlockMirrorTextToBlocks.xmlToString = function (xml) {
    return new XMLSerializer().serializeToString(xml);
};

BlockMirrorTextToBlocks.prototype.convertSourceToCodeBlock = function (python_source) {
    var xml = document.createElement("xml");
    xml.appendChild(BlockMirrorTextToBlocks.raw_block(python_source));
    return BlockMirrorTextToBlocks.xmlToString(xml);
};
/**
 * The main function for converting a string representation of Python
 * code to the Blockly XML representation.
 *
 * @param {string} filename - The filename being parsed.
 * @param {string} python_source - The string representation of Python
 *      code (e.g., "a = 0").
 * @returns {Object} An object which will either have the converted
 *      source code or an error message and the code as a code-block.
 */


BlockMirrorTextToBlocks.prototype.convertSource = function (filename, python_source) {
    if (!python_source) {
        console.error("python_source 是 null 或 undefined");
        return {
            "xml": "",
            "error": "无效的 Python 源代码",
            "rawXml": null
        };
    }
    var xml = document.createElement("xml"); // Attempt parsing - might fail!

    var parse,
        ast = null,
        symbol_table,
        error;
    var badChunks = [];
    var originalSource = python_source;
    this.source = python_source.split("\n");
    var previousLine = 1 + this.source.length;

    while (ast === null) {
        if (python_source.trim() === "") {
            if (badChunks.length) {
                xml.appendChild(BlockMirrorTextToBlocks.raw_block(badChunks.join("\n")));
            }

            return {
                "xml": BlockMirrorTextToBlocks.xmlToString(xml),
                "error": null,
                rawXml: xml
            };
        }

        try {
            parse = Sk.parse(filename, python_source);
            ast = Sk.astFromParse(parse.cst, filename, parse.flags);
        } catch (e) {
            //console.error(e);
            error = e;

            if (e.traceback && e.traceback.length && e.traceback[0].lineno && e.traceback[0].lineno < previousLine) {
                previousLine = e.traceback[0].lineno - 1;
                badChunks = badChunks.concat(this.source.slice(previousLine));
                this.source = this.source.slice(0, previousLine);
                python_source = this.source.join("\n");
            } else {
                //console.error(e);
                xml.appendChild(BlockMirrorTextToBlocks.raw_block(originalSource));
                return {
                    "xml": BlockMirrorTextToBlocks.xmlToString(xml),
                    "error": error,
                    "rawXml": xml
                };
            }
        }
    }

    this.comments = {};

    for (var commentLocation in parse.comments) {
        var lineColumn = commentLocation.split(",");
        var yLocation = parseInt(lineColumn[0], 10);
        var xLocation = parseInt(lineColumn[1], 10);
        this.comments[yLocation] = xLocation + "|" + parse.comments[commentLocation];
    }

    this.highestLineSeen = 0;
    this.levelIndex = 0;
    this.nextExpectedLine = 0;
    this.measureNode(ast);
    var converted = this.convert(ast);

    if (converted !== null) {
        for (var block = 0; block < converted.length; block += 1) {
            xml.appendChild(converted[block]);
        }
    }

    if (badChunks.length) {
        xml.appendChild(BlockMirrorTextToBlocks.raw_block(badChunks.join("\n")));
    }

    return {
        "xml": BlockMirrorTextToBlocks.xmlToString(xml),
        "error": null,
        "lineMap": this.lineMap,
        'comments': this.comments,
        "rawXml": xml
    };
};

BlockMirrorTextToBlocks.prototype.recursiveMeasure = function (node, nextBlockLine) {
    if (node === undefined) {
        return;
    }

    var myNext = nextBlockLine;

    if ("orelse" in node && node.orelse.length > 0) {
        if (node.orelse.length === 1 && node.orelse[0]._astname === "If") {
            myNext = node.orelse[0].lineno - 1;
        } else {
            myNext = node.orelse[0].lineno - 1 - 1;
        }
    }

    this.heights.push(nextBlockLine);

    if ("body" in node) {
        for (var i = 0; i < node.body.length; i++) {
            var next = void 0;

            if (i + 1 === node.body.length) {
                next = myNext;
            } else {
                next = node.body[i + 1].lineno - 1;
            }

            this.recursiveMeasure(node.body[i], next);
        }
    }

    if ("orelse" in node) {
        for (var _i = 0; _i < node.orelse.length; _i++) {
            var _next = void 0;

            if (_i === node.orelse.length) {
                _next = nextBlockLine;
            } else {
                _next = 1 + (node.orelse[_i].lineno - 1);
            }

            this.recursiveMeasure(node.orelse[_i], _next);
        }
    }
};

BlockMirrorTextToBlocks.prototype.measureNode = function (node) {
    this.heights = [];
    this.recursiveMeasure(node, this.source.length - 1);
    this.heights.shift();
};

BlockMirrorTextToBlocks.prototype.getSourceCode = function (frm, to) {
    var lines = this.source.slice(frm - 1, to); // Strip out any starting indentation.

    if (lines.length > 0) {
        var indentation = lines[0].search(/\S/);

        for (var i = 0; i < lines.length; i++) {
            lines[i] = lines[i].substring(indentation);
        }
    }

    return lines.join("\n");
};

BlockMirrorTextToBlocks.prototype.convertBody = function (node, parent) {
    this.levelIndex += 1;
    var is_top_level = this.isTopLevel(parent); // Empty body, return nothing

    /*if (node.length === 0) {
        return null;
    }*/
    // Final result list

    var children = [],
        // The complete set of peers
        root = null,
        // The top of the current peer
        current = null,
        // The bottom of the current peer
        levelIndex = this.levelIndex;

    function addPeer(peer) {
        if (root === null) {
            children.push(peer);
        } else {
            children.push(root);
        }

        root = peer;
        current = peer;
    }

    function finalizePeers() {
        if (root != null) {
            children.push(root);
        }
    }

    function nestChild(child) {
        if (root == null) {
            root = child;
            current = child;
        } else if (current == null) {
            root = current;
        } else {
            var nextElement = document.createElement("next");
            nextElement.appendChild(child);
            current.appendChild(nextElement);
            current = child;
        }
    }

    var lineNumberInBody = 0,
        lineNumberInProgram,
        previousLineInProgram = null,
        distance,
        skipped_line,
        commentCount,
        previousHeight = null,
        previousWasStatement = false,
        visitedFirstLine = false,
        wasFirstLine = false; // Iterate through each node

    for (var i = 0; i < node.length; i++) {
        lineNumberInBody += 1;
        lineNumberInProgram = node[i].lineno;
        distance = 0;
        wasFirstLine = true;

        if (previousLineInProgram != null) {
            distance = lineNumberInProgram - previousLineInProgram - 1;
            wasFirstLine = false;
        }

        lineNumberInBody += distance; // Handle earlier comments

        commentCount = 0;

        for (var _commentLineInProgram in this.comments) {
            if (_commentLineInProgram <= lineNumberInProgram) {
                var comment = this.comments[_commentLineInProgram].split("|", 2);

                if (parseInt(comment[0], 10) / 4 == this.levelIndex - 1) {
                    var commentLine = comment[1];
                    var commentChild = this.ast_Comment(commentLine, _commentLineInProgram);
                    this.highestLineSeen += 1;

                    if (previousLineInProgram == null) {
                        nestChild(commentChild);
                    } else {
                        var skipped_previous_line = Math.abs(previousLineInProgram - _commentLineInProgram) > 1;

                        if (is_top_level && skipped_previous_line) {
                            addPeer(commentChild);
                        } else {
                            nestChild(commentChild);
                        }
                    }

                    previousLineInProgram = _commentLineInProgram;
                    this.highestLineSeen = Math.max(this.highestLineSeen, parseInt(_commentLineInProgram, 10));
                    distance = lineNumberInProgram - previousLineInProgram;
                    delete this.comments[_commentLineInProgram];
                    commentCount += 1;
                }

                visitedFirstLine = true;
                previousWasStatement = true;
            }
        }

        distance = lineNumberInProgram - this.highestLineSeen;
        this.highestLineSeen = Math.max(lineNumberInProgram, this.highestLineSeen); // Now convert the actual node

        var height = this.heights.shift();
        var originalSourceCode = this.getSourceCode(lineNumberInProgram, height);
        var newChild = this.convertStatement(node[i], originalSourceCode, parent); // Skip null blocks (e.g., imports)

        if (newChild == null) {
            continue;
        }

        skipped_line = distance > 1;
        previousLineInProgram = lineNumberInProgram;
        previousHeight = height; // Handle top-level expression blocks

        if (is_top_level && newChild.constructor === Array) {
            addPeer(newChild[0]); // Handle skipped line
        } else if (is_top_level && skipped_line && visitedFirstLine) {
            addPeer(newChild); // The previous line was not a Peer
        } else if (is_top_level && !previousWasStatement) {
            addPeer(newChild); // Otherwise, always embed it in there.
        } else {
            nestChild(newChild);
        }

        previousWasStatement = newChild.constructor !== Array;
        visitedFirstLine = true;
    } // Handle comments that are on the very last line


    var lastLineNumber = lineNumberInProgram + 1;

    if (lastLineNumber in this.comments) {
        var comment = this.comments[lastLineNumber].split("|", 2);

        if (parseInt(comment[0], 10) / 4 == this.levelIndex - 1) {
            var lastComment = comment[1];

            var _commentChild = this.ast_Comment(lastComment, lastLineNumber);

            if (is_top_level && !previousWasStatement) {
                addPeer(_commentChild);
            } else {
                nestChild(_commentChild);
            }

            delete this.comments[lastLineNumber];
            this.highestLineSeen += 1;
        }
    } // Handle any extra comments that stuck around


    if (is_top_level) {
        for (var commentLineInProgram in this.comments) {
            var comment = this.comments[commentLineInProgram].split("|", 2);

            if (parseInt(comment[0], 10) / 4 == this.levelIndex - 1) {
                var commentInProgram = comment[1];

                var _commentChild2 = this.ast_Comment(commentInProgram, commentLineInProgram);

                distance = commentLineInProgram - previousLineInProgram;

                if (previousLineInProgram == null) {
                    addPeer(_commentChild2);
                } else if (distance > 1) {
                    addPeer(_commentChild2);
                } else {
                    nestChild(_commentChild2);
                }

                previousLineInProgram = commentLineInProgram;
                delete this.comments[lastLineNumber];
            }
        }
    }

    finalizePeers();
    this.levelIndex -= 1;
    return children;
};

BlockMirrorTextToBlocks.prototype.TOP_LEVEL_NODES = ['Module', 'Expression', 'Interactive', 'Suite'];

BlockMirrorTextToBlocks.prototype.isTopLevel = function (parent) {
    return !parent || this.TOP_LEVEL_NODES.indexOf(parent._astname) !== -1;
};

BlockMirrorTextToBlocks.prototype.convert = function (node, parent) {
    var functionName = 'ast_' + node._astname;

    if (this[functionName] === undefined) {
        throw new Error("Could not find function: " + functionName);
    }

    node._parent = parent;
    return this[functionName](node, parent);
};

function arrayMax(array) {
    return array.reduce(function (a, b) {
        return Math.max(a, b);
    });
}

function arrayMin(array) {
    return array.reduce(function (a, b) {
        return Math.min(a, b);
    });
}

BlockMirrorTextToBlocks.prototype.convertStatement = function (node, full_source, parent) {
    try {
        return this.convert(node, parent);
    } catch (e) {
        var heights = this.getChunkHeights(node);
        var extractedSource = this.getSourceCode(arrayMin(heights), arrayMax(heights));
        console.error(e);
        return BlockMirrorTextToBlocks.raw_block(extractedSource);
    }
};

BlockMirrorTextToBlocks.prototype.getChunkHeights = function (node) {
    var lineNumbers = [];

    if (node.hasOwnProperty("lineno")) {
        lineNumbers.push(node.lineno);
    }

    if (node.hasOwnProperty("body")) {
        for (var i = 0; i < node.body.length; i += 1) {
            var subnode = node.body[i];
            lineNumbers = lineNumbers.concat(this.getChunkHeights(subnode));
        }
    }

    if (node.hasOwnProperty("orelse")) {
        for (var _i2 = 0; _i2 < node.orelse.length; _i2 += 1) {
            var _subnode = node.orelse[_i2];
            lineNumbers = lineNumbers.concat(this.getChunkHeights(_subnode));
        }
    }

    return lineNumbers;
};

BlockMirrorTextToBlocks.create_block = function (type, lineNumber, fields, values, settings, mutations, statements) {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        var newBlock = document.createElement("block"); // Settings

        newBlock.setAttribute("type", type);
        newBlock.setAttribute("line_number", lineNumber);

        for (var setting in settings) {
            var settingValue = settings[setting];
            newBlock.setAttribute(setting, settingValue);
        } // Mutations


        if (mutations !== undefined && Object.keys(mutations).length > 0) {
            var newMutation = document.createElement("mutation");

            for (var mutation in mutations) {
                var mutationValue = mutations[mutation];

                if (mutation.charAt(0) === '@') {
                    newMutation.setAttribute(mutation.substr(1), mutationValue);
                } else if (mutationValue != null && mutationValue.constructor === Array) {
                    for (var i = 0; i < mutationValue.length; i++) {
                        var mutationNode = document.createElement(mutation);
                        mutationNode.setAttribute("name", mutationValue[i]);
                        newMutation.appendChild(mutationNode);
                    }
                } else {
                    var _mutationNode = document.createElement("arg");

                    if (mutation.charAt(0) === '!') {
                        _mutationNode.setAttribute("name", "");
                    } else {
                        _mutationNode.setAttribute("name", mutation);
                    }

                    if (mutationValue !== null) {
                        _mutationNode.appendChild(mutationValue);
                    }

                    newMutation.appendChild(_mutationNode);
                }
            }

            newBlock.appendChild(newMutation);
        } // Fields


        for (var field in fields) {
            var fieldValue = fields[field];
            var newField = document.createElement("field");
            newField.setAttribute("name", field);
            newField.appendChild(document.createTextNode(fieldValue));
            newBlock.appendChild(newField);
        } // Values


        for (var value in values) {
            var valueValue = values[value];
            var newValue = document.createElement("value");

            if (valueValue !== null) {
                newValue.setAttribute("name", value);
                newValue.appendChild(valueValue);
                newBlock.appendChild(newValue);
            }
        } // Statements


        if (statements !== undefined && Object.keys(statements).length > 0) {
            for (var statement in statements) {
                var statementValue = statements[statement];

                if (statementValue == null) {
                    continue;
                } else {
                    for (var _i3 = 0; _i3 < statementValue.length; _i3 += 1) {
                        // In most cases, you really shouldn't ever have more than
                        //  one statement in this list. I'm not sure Blockly likes
                        //  that.
                        var newStatement = document.createElement("statement");
                        newStatement.setAttribute("name", statement);
                        newStatement.appendChild(statementValue[_i3]);
                        newBlock.appendChild(newStatement);
                    }
                }
            }
        }
    }
    return newBlock;
};

BlockMirrorTextToBlocks.raw_block = function (txt) {
    // TODO: lineno as second parameter!
    return BlockMirrorTextToBlocks.create_block("ast_Raw", 0, {
        "TEXT": txt
    });
};

BlockMirrorTextToBlocks.BLOCKS = [];

BlockMirrorTextToBlocks.prototype['ast_Module'] = function (node) {
    return this.convertBody(node.body, node);
};

BlockMirrorTextToBlocks.prototype['ast_Interactive'] = function (node) {
    return this.convertBody(node.body, node);
};

BlockMirrorTextToBlocks.prototype['ast_Expression'] = BlockMirrorTextToBlocks.prototype['ast_Interactive'];
BlockMirrorTextToBlocks.prototype['ast_Suite'] = BlockMirrorTextToBlocks.prototype['ast_Module'];

BlockMirrorTextToBlocks.prototype['ast_Pass'] = function () {
    return null; //block("controls_pass");
};


BlockMirrorTextToBlocks.prototype.convertElements = function (key, values, parent) {
    var output = {};
    for (var i = 0; i < values.length; i++) {
        output[key + i] = this.convert(values[i], parent);
    }
    return output;
};

BlockMirrorTextToBlocks.prototype.LOCKED_BLOCK = {
    "inline": "true",
    'deletable': "false",
    "movable": "false"
};

BlockMirrorTextToBlocks.COLOR = {
    VARIABLES: 345,
    FUNCTIONS: 210,
    OO: 240,
    CONTROL: 270,
    MATH: 190,
    TEXT: 120,
    FILE: 170,
    PLOTTING: 140,
    LOGIC: 225,
    PYTHON: 60,
    EXCEPTIONS: 300,
    SEQUENCES: 15,
    LIST: 30,
    DICTIONARY: 0,
    SET: 10,
    TUPLE: 20
};

BlockMirrorTextToBlocks.ANNOTATION_OPTIONS = [
    ["int", "int"],
    ["float", "float"],
    ["str", "str"],
    ["bool", "bool"],
    ["None", "None"]
];

BlockMirrorTextToBlocks.ANNOTATION_GENERATE = {};
BlockMirrorTextToBlocks.ANNOTATION_OPTIONS.forEach(function (ann) {
    BlockMirrorTextToBlocks.ANNOTATION_GENERATE[ann[1]] = ann[0];
});

BlockMirrorTextToBlocks.prototype.getBuiltinAnnotation = function (annotation) {
    let result = false;
    // Can we turn it into a basic type?
    if (annotation._astname === 'Name') {
        result = Sk.ffi.remapToJs(annotation.id);
    } else if (annotation._astname === 'Str') {
        result = Sk.ffi.remapToJs(annotation.s);
    }

    // Potentially filter out unknown annotations
    if (result !== false && this.strictAnnotations) {
        if (this.strictAnnotations.indexOf(result) !== -1) {
            return result;
        } else {
            return false;
        }
    } else {
        return result;
    }
}

BlockMirrorTextToBlocks.prototype['ast_AnnAssign'] = function (node, parent) {
    let target = node.target;
    let annotation = node.annotation;
    let value = node.value;

    let values = {};
    let mutations = { '@initialized': false };
    if (value !== null) {
        values['VALUE'] = this.convert(value, node);
        mutations['@initialized'] = true;
    }

    // TODO: This controls whether the annotation is stored in __annotations__
    let simple = node.simple;

    let builtinAnnotation = this.getBuiltinAnnotation(annotation);

    if (target._astname === 'Name' && target.id.v !== '__' && builtinAnnotation !== false) {
        mutations['@str'] = annotation._astname === 'Str'
        return BlockMirrorTextToBlocks.create_block("ast_AnnAssign", node.lineno, {
            'TARGET': target.id.v,
            'ANNOTATION': builtinAnnotation,
        },
            values,
            {
                "inline": "true",
            }, mutations);
    } else {
        values['TARGET'] = this.convert(target, node);
        values['ANNOTATION'] = this.convert(annotation, node);
        return BlockMirrorTextToBlocks.create_block("ast_AnnAssignFull", node.lineno, {},
            values,
            {
                "inline": "true",
            }, mutations);
    }
};

// ast_Assert
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_AssertFull",
    "message0": "assert %1 %2",
    "args0": [
        { "type": "input_value", "name": "TEST" },
        { "type": "input_value", "name": "MSG" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": BlockMirrorTextToBlocks.COLOR.LOGIC,
});

BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_Assert",
    "message0": "assert %1",
    "args0": [
        { "type": "input_value", "name": "TEST" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": BlockMirrorTextToBlocks.COLOR.LOGIC,
});


BlockMirrorTextToBlocks.prototype['ast_Assert'] = function (node, parent) {
    var test = node.test;
    var msg = node.msg;
    if (msg == null) {
        return BlockMirrorTextToBlocks.create_block("ast_Assert", node.lineno, {}, {
            "TEST": this.convert(test, node)
        });
    } else {
        return BlockMirrorTextToBlocks.create_block("ast_AssertFull", node.lineno, {}, {
            "TEST": this.convert(test, node),
            "MSG": this.convert(msg, node)
        });
    }
};

BlockMirrorTextToBlocks.prototype['ast_Assign'] = function (node, parent) {
    let targets = node.targets;
    let value = node.value;

    let values;
    let fields = {};
    let simpleTarget = (targets.length === 1 && targets[0]._astname === 'Name');
    if (simpleTarget) {
        values = {};
        fields['VAR'] = Sk.ffi.remapToJs(targets[0].id);
    } else {
        values = this.convertElements("TARGET", targets, node);
    }
    values['VALUE'] = this.convert(value, node);

    return BlockMirrorTextToBlocks.create_block("ast_Assign", node.lineno, fields,
        values,
        {
            "inline": "true",
        }, {
        "@targets": targets.length,
        "@simple": simpleTarget
    });
};

// ast_Attribute
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_AttributeFull",
    "lastDummyAlign0": "RIGHT",
    "message0": "%1 . %2",
    "args0": [
        { "type": "input_value", "name": "VALUE" },
        { "type": "field_input", "name": "ATTR", "text": "default" }
    ],
    "inputsInline": true,
    "output": null,
    "colour": BlockMirrorTextToBlocks.COLOR.OO,
});

BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_Attribute",
    "message0": "%1 . %2",
    "args0": [
        { "type": "field_variable", "name": "VALUE", "variable": "variable" },
        { "type": "field_input", "name": "ATTR", "text": "attribute" }
    ],
    "inputsInline": true,
    "output": null,
    "colour": BlockMirrorTextToBlocks.COLOR.OO,
});

BlockMirrorTextToBlocks.prototype['ast_Attribute'] = function (node, parent) {
    let value = node.value;
    let attr = node.attr;

    //if (value.constructor)
    if (value._astname == "Name") {
        return BlockMirrorTextToBlocks.create_block("ast_Attribute", node.lineno, {
            "VALUE": Sk.ffi.remapToJs(value.id),
            "ATTR": Sk.ffi.remapToJs(attr)
        },);
    } else {
        return BlockMirrorTextToBlocks.create_block("ast_AttributeFull", node.lineno, {
            "ATTR": Sk.ffi.remapToJs(attr)
        }, {
            "VALUE": this.convert(value, node)
        });
    }
}


BlockMirrorTextToBlocks.prototype['ast_AugAssign'] = function (node, parent) {
    let target = node.target;
    let op = node.op.name;
    let value = node.value;

    let values = { 'VALUE': this.convert(value, node) };
    let fields = { 'OP_NAME': op };
    let simpleTarget = target._astname === 'Name';
    if (simpleTarget) {
        fields['VAR'] = Sk.ffi.remapToJs(target.id);
    } else {
        values['TARGET'] = this.convert(value, node);
    }

    let preposition = op;

    let allOptions = BINOPS_SIMPLE.indexOf(op) === -1;

    return BlockMirrorTextToBlocks.create_block("ast_AugAssign", node.lineno, fields,
        values,
        {
            "inline": "true",
        }, {
        "@options": allOptions,
        "@simple": simpleTarget,
        "@preposition": preposition
    });
};



// ast_BinOp
BlockMirrorTextToBlocks.BINOPS = [
    ["+", "Add", Order.UNARY_SIGN, 'Return the sum of the two numbers.', 'increase', 'by'],
    ["-", "Sub", Order.UNARY_SIGN, 'Return the difference of the two numbers.', 'decrease', 'by'],
    ["*", "Mult", Order.MULTIPLICATIVE, 'Return the product of the two numbers.', 'multiply', 'by'],
    ["/", "Div", Order.MULTIPLICATIVE, 'Return the quotient of the two numbers.', 'divide', 'by'],
    ["%", "Mod", Order.MULTIPLICATIVE, 'Return the remainder of the first number divided by the second number.',
        'modulo', 'by'],
    ["**", "Pow", Order.EXPONENTIATION, 'Return the first number raised to the power of the second number.',
        'raise', 'to'],
    ["//", "FloorDiv", Order.MULTIPLICATIVE, 'Return the truncated quotient of the two numbers.',
        'floor divide', 'by'],
    ["<<", "LShift", Order.BITWISE_SHIFT, 'Return the left number left shifted by the right number.',
        'left shift', 'by'],
    [">>", "RShift", Order.BITWISE_SHIFT, 'Return the left number right shifted by the right number.',
        'right shift', 'by'],
    ["|", "BitOr", Order.BITWISE_OR, 'Returns the bitwise OR of the two values.',
        'bitwise OR', 'using'],
    ["^", "BitXor", Order.BITWISE_XOR, 'Returns the bitwise XOR of the two values.',
        'bitwise XOR', 'using'],
    ["&", "BitAnd", Order.BITWISE_AND, 'Returns the bitwise AND of the two values.',
        'bitwise AND', 'using'],
    ["@", "MatMult", Order.MULTIPLICATIVE, 'Return the matrix multiplication of the two numbers.',
        'matrix multiply', 'by']
];
var BINOPS_SIMPLE = ['Add', 'Sub', 'Mult', 'Div', 'Mod', 'Pow'];
var BINOPS_BLOCKLY_DISPLAY_FULL = BlockMirrorTextToBlocks.BINOPS.map(
    binop => [binop[0], binop[1]]
);
var BINOPS_BLOCKLY_DISPLAY = BINOPS_BLOCKLY_DISPLAY_FULL.filter(
    binop => BINOPS_SIMPLE.indexOf(binop[1]) >= 0
);
BlockMirrorTextToBlocks.BINOPS_AUGASSIGN_DISPLAY_FULL = BlockMirrorTextToBlocks.BINOPS.map(
    binop => [binop[4], binop[1]]
);
BlockMirrorTextToBlocks.BINOPS_AUGASSIGN_DISPLAY = BlockMirrorTextToBlocks.BINOPS_AUGASSIGN_DISPLAY_FULL.filter(
    binop => BINOPS_SIMPLE.indexOf(binop[1]) >= 0
);

var BINOPS_BLOCKLY_GENERATE = {};
BlockMirrorTextToBlocks.BINOPS_AUGASSIGN_PREPOSITION = {};
BlockMirrorTextToBlocks.BINOPS.forEach(function (binop) {
    BINOPS_BLOCKLY_GENERATE[binop[1]] = [" " + binop[0], binop[2]];
    BlockMirrorTextToBlocks.BINOPS_AUGASSIGN_PREPOSITION[binop[1]] = binop[5];
    //Blockly.Constants.Math.TOOLTIPS_BY_OP[binop[1]] = binop[3];
});

BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_BinOpFull",
    "message0": "%1 %2 %3",
    "args0": [
        { "type": "input_value", "name": "A" },
        { "type": "field_dropdown", "name": "OP", "options": BINOPS_BLOCKLY_DISPLAY_FULL },
        { "type": "input_value", "name": "B" }
    ],
    "inputsInline": true,
    "output": null,
    "colour": BlockMirrorTextToBlocks.COLOR.MATH
    //"extensions": ["math_op_tooltip"]
});

// 捨棄ast_BinOp，全部改用ast_BinOpFull
// BlockMirrorTextToBlocks.BLOCKS.push({
//     "type": "ast_BinOp",
//     "message0": "%1 %2 %3",
//     "args0": [
//         { "type": "input_value", "name": "A" },
//         { "type": "field_dropdown", "name": "OP", "options": BINOPS_BLOCKLY_DISPLAY },
//         { "type": "input_value", "name": "B" }
//     ],
//     "inputsInline": true,
//     "output": null,
//     "colour": BlockMirrorTextToBlocks.COLOR.MATH
//     //"extensions": ["math_op_tooltip"]
// });

BlockMirrorTextToBlocks.prototype['ast_BinOp'] = function (node, parent) {
    let left = node.left;
    let op = node.op.name;
    let right = node.right;

    // let blockName = (BINOPS_SIMPLE.indexOf(op) >= 0) ? "ast_BinOp" : 'ast_BinOpFull';
    let blockName = 'ast_BinOpFull';

    return BlockMirrorTextToBlocks.create_block(blockName, node.lineno, {
        "OP": op
    }, {
        "A": this.convert(left, node),
        "B": this.convert(right, node)
    }, {
        "inline": true
    });
}

BlockMirrorTextToBlocks.prototype['ast_BinOpFull'] = BlockMirrorTextToBlocks.prototype['ast_BinOp'];

// ast_BoolOp
BlockMirrorTextToBlocks.BOOLOPS = [
    ["and", "And", Order.LOGICAL_AND, 'Return whether the left and right both evaluate to True.'],
    ["or", "Or", Order.LOGICAL_OR, 'Return whether either the left or right evaluate to True.']
];
var BOOLOPS_BLOCKLY_DISPLAY = BlockMirrorTextToBlocks.BOOLOPS.map(
    boolop => [boolop[0], boolop[1]]
);
var BOOLOPS_BLOCKLY_GENERATE = {};
BlockMirrorTextToBlocks.BOOLOPS.forEach(function (boolop) {
    BOOLOPS_BLOCKLY_GENERATE[boolop[1]] = [" " + boolop[0] + " ", boolop[2]];
});

BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_BoolOp",
    "message0": "%1 %2 %3",
    "args0": [
        { "type": "input_value", "name": "A" },
        { "type": "field_dropdown", "name": "OP", "options": BOOLOPS_BLOCKLY_DISPLAY },
        { "type": "input_value", "name": "B" }
    ],
    "inputsInline": true,
    "output": null,
    "colour": BlockMirrorTextToBlocks.COLOR.LOGIC
});

BlockMirrorTextToBlocks.prototype['ast_BoolOp'] = function (node, parent) {
    var op = node.op;
    var values = node.values;
    var result_block = this.convert(values[0], node);
    for (var i = 1; i < values.length; i += 1) {
        result_block = BlockMirrorTextToBlocks.create_block("ast_BoolOp", node.lineno, {
            "OP": op.name
        }, {
            "A": result_block,
            "B": this.convert(values[i], node)
        }, {
            "inline": "true"
        });
    }
    return result_block;
};


// ast_Break
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_Break",
    "message0": "break",
    "inputsInline": false,
    "previousStatement": null,
    "nextStatement": null,
    "colour": BlockMirrorTextToBlocks.COLOR.CONTROL,
});

BlockMirrorTextToBlocks.prototype['ast_Break'] = function (node, parent) {
    return BlockMirrorTextToBlocks.create_block("ast_Break", node.lineno);
};


BlockMirrorTextToBlocks.prototype.getAsModule = function (node) {
    if (node._astname === 'Name') {
        return Sk.ffi.remapToJs(node.id);
    } else if (node._astname === 'Attribute') {
        let origin = this.getAsModule(node.value);
        if (origin !== null) {
            return origin + '.' + Sk.ffi.remapToJs(node.attr);
        }
    } else {
        return null;
    }
};

//                              messageBefore, message, name
// function call: print() -> "print" ([message]) ; print
// Module function: plt.show() -> "show plot" ([plot]) ; plt.show
// Method call: "test".title() -> "make" [str] "title case" () ; .title ; isMethod = true

BlockMirrorTextToBlocks.prototype['ast_Call'] = function (node, parent) {
    let func = node.func;
    let args = node.args;
    let keywords = node.keywords;

    // Can we make any guesses about this based on its name?
    let signature = null;
    let isMethod = false;
    let module = null;
    let premessage = "";
    let message = "";
    let name = "";
    let caller = null;
    let colour = BlockMirrorTextToBlocks.COLOR.FUNCTIONS;

    if (func._astname === 'Name') {
        message = name = Sk.ffi.remapToJs(func.id);
        if (name in this.FUNCTION_SIGNATURES) {
            signature = this.FUNCTION_SIGNATURES[Sk.ffi.remapToJs(func.id)];
        }
    } else if (func._astname === 'Attribute') {
        isMethod = true;
        caller = func.value;
        let potentialModule = this.getAsModule(caller);
        let attributeName = Sk.ffi.remapToJs(func.attr);
        message = "." + attributeName;
        if (potentialModule in this.MODULE_FUNCTION_SIGNATURES) {
            signature = this.MODULE_FUNCTION_SIGNATURES[potentialModule][attributeName];
            module = potentialModule;
            message = name = potentialModule + message;
            isMethod = false;
        } else if (attributeName in this.METHOD_SIGNATURES) {
            signature = this.METHOD_SIGNATURES[attributeName];
            name = message;
        } else {
            name = message;
        }
    } else {
        isMethod = true;
        message = "";
        name = "";
        caller = func;
        // (lambda x: x)()
    }
    let returns = true;

    if (signature !== null && signature !== undefined) {
        if (signature.custom) {
            try {
                return signature.custom(node, parent, this)
            } catch (e) {
                console.error(e);
                // We tried to be fancy and failed, better fall back to default behavior!
            }
        }
        if ('returns' in signature) {
            returns = signature.returns;
        }
        if ('message' in signature) {
            message = signature.message;
        }
        if ('premessage' in signature) {
            premessage = signature.premessage;
        }
        if ('colour' in signature) {
            colour = signature.colour;
        }
    }

    returns = returns && (parent._astname !== 'Expr');  // 只有當父節點是 Expr 節點,且先前的 returns 為 false 時,才會回傳statement

    let argumentsNormal = {};
    // TODO: do I need to be limiting only the *args* length, not keywords?
    let argumentsMutation = {
        "@arguments": (args !== null ? args.length : 0) +
            (keywords !== null ? keywords.length : 0),
        "@returns": returns,
        "@parameters": true,
        "@method": isMethod,
        "@name": name,
        "@message": '',
        "@premessage": premessage,
        "@colour": colour,
        "@module": module || ""
    };
    // Handle arguments
    let overallI = 0;
    if (args !== null) {
        for (let i = 0; i < args.length; i += 1, overallI += 1) {
            argumentsNormal["ARG" + overallI] = this.convert(args[i], node);
            argumentsMutation["UNKNOWN_ARG:" + overallI] = null;
        }
    }
    if (keywords !== null) {
        for (let i = 0; i < keywords.length; i += 1, overallI += 1) {
            let keyword = keywords[i];
            let arg = keyword.arg;
            let value = keyword.value;
            if (arg === null) {
                argumentsNormal["ARG" + overallI] = this.convert(value, node);
                argumentsMutation["KWARGS:" + overallI] = null;
            } else {
                argumentsNormal["ARG" + overallI] = this.convert(value, node);
                argumentsMutation["KEYWORD:" + Sk.ffi.remapToJs(arg)] = null;
            }
        }
    }
    // Build actual block
    let newBlock;
    if (isMethod) {
        argumentsNormal['FUNC'] = this.convert(caller, node);
        newBlock = BlockMirrorTextToBlocks.create_block("ast_Call", node.lineno,
            {}, argumentsNormal, { inline: true }, argumentsMutation);
    } else {
        newBlock = BlockMirrorTextToBlocks.create_block("ast_Call", node.lineno, {},
            argumentsNormal, { inline: true }, argumentsMutation);
    }
    // Return as either statement or expression
    if (returns) {
        return newBlock;
    } else {
        return [newBlock];
    }
};


BlockMirrorTextToBlocks.prototype['ast_ClassDef'] = function (node, parent) {
    let name = node.name;
    let bases = node.bases;
    let keywords = node.keywords;
    let body = node.body;
    let decorator_list = node.decorator_list;

    let values = {};
    let fields = { 'NAME': Sk.ffi.remapToJs(name) };

    if (decorator_list !== null) {
        for (let i = 0; i < decorator_list.length; i++) {
            values['DECORATOR' + i] = this.convert(decorator_list[i], node);
        }
    }

    if (bases !== null) {
        for (let i = 0; i < bases.length; i++) {
            values['BASE' + i] = this.convert(bases[i], node);
        }
    }

    if (keywords !== null) {
        for (let i = 0; i < keywords.length; i++) {
            values['KEYWORDVALUE' + i] = this.convert(keywords[i].value, node);
            let arg = keywords[i].arg;
            if (arg === null) {
                fields['KEYWORDNAME' + i] = "**";
            } else {
                fields['KEYWORDNAME' + i] = Sk.ffi.remapToJs(arg);
            }
        }
    }

    return BlockMirrorTextToBlocks.create_block("ast_ClassDef", node.lineno, fields,
        values,
        {
            "inline": "false"
        }, {
        "@decorators": (decorator_list === null ? 0 : decorator_list.length),
        "@bases": (bases === null ? 0 : bases.length),
        "@keywords": (keywords === null ? 0 : keywords.length),
    }, {
        'BODY': this.convertBody(body, node)
    });
};


// ast_Comment
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_Comment",
    "message0": "# Comment: %1",
    "args0": [{ "type": "field_input", "name": "BODY", "text": "will be ignored" }],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": BlockMirrorTextToBlocks.COLOR.PYTHON,
});

BlockMirrorTextToBlocks.prototype['ast_Comment'] = function (txt, lineno) {
    var commentText = txt.slice(1);
    /*if (commentText.length && commentText[0] === " ") {
        commentText = commentText.substring(1);
    }*/
    return BlockMirrorTextToBlocks.create_block("ast_Comment", lineno, {
        "BODY": commentText
    })
};


// ast_Comp
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_comprehensionFor",
    "message0": "for %1 in %2",
    "args0": [
        { "type": "input_value", "name": "TARGET" },
        { "type": "input_value", "name": "ITER" }
    ],
    "inputsInline": true,
    "output": "ComprehensionFor",
    "colour": BlockMirrorTextToBlocks.COLOR.SEQUENCES
});

BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_comprehensionIf",
    "message0": "if %1",
    "args0": [
        { "type": "input_value", "name": "TEST" }
    ],
    "inputsInline": true,
    "output": "ComprehensionIf",
    "colour": BlockMirrorTextToBlocks.COLOR.SEQUENCES
});


BlockMirrorTextToBlocks.COMP_SETTINGS = {
    'ListComp': { start: '[', end: ']', color: BlockMirrorTextToBlocks.COLOR.LIST },
    'SetComp': { start: '{', end: '}', color: BlockMirrorTextToBlocks.COLOR.SET },
    'GeneratorExp': { start: '(', end: ')', color: BlockMirrorTextToBlocks.COLOR.SEQUENCES },
    'DictComp': { start: '{', end: '}', color: BlockMirrorTextToBlocks.COLOR.DICTIONARY },
};

['ListComp', 'SetComp', 'GeneratorExp', 'DictComp'].forEach(function (kind) {

    BlockMirrorTextToBlocks.prototype['ast_' + kind] = function (node, parent) {
        let generators = node.generators;

        let elements = {};
        if (kind === 'DictComp') {
            let key = node.key;
            let value = node.value;
            elements["ELT"] = BlockMirrorTextToBlocks.create_block("ast_DictItem", node.lineno, {},
                {
                    "KEY": this.convert(key, node),
                    "VALUE": this.convert(value, node)
                },
                {
                    "inline": "true",
                    'deletable': "false",
                    "movable": "false"
                });
        } else {
            let elt = node.elt;
            elements["ELT"] = this.convert(elt, node);
        }
        let DEFAULT_SETTINGS = {
            "inline": "true",
            'deletable': "false",
            "movable": "false"
        };
        let g = 0;
        for (let i = 0; i < generators.length; i++) {
            let target = generators[i].target;
            let iter = generators[i].iter;
            let ifs = generators[i].ifs;
            let is_async = generators[i].is_async;
            elements["GENERATOR" + g] = BlockMirrorTextToBlocks.create_block("ast_comprehensionFor", node.lineno, {},
                {
                    "ITER": this.convert(iter, node),
                    "TARGET": this.convert(target, node)
                },
                DEFAULT_SETTINGS);
            g += 1;
            if (ifs) {
                for (let j = 0; j < ifs.length; j++) {
                    elements["GENERATOR" + g] = BlockMirrorTextToBlocks.create_block("ast_comprehensionIf", node.lineno, {},
                        {
                            "TEST": this.convert(ifs[j], node)
                        },
                        DEFAULT_SETTINGS);
                    g += 1;
                }
            }
        }

        return BlockMirrorTextToBlocks.create_block("ast_" + kind, node.lineno, {},
            elements,
            {
                "inline": "false"
            }, {
            "@items": g
        });
    };

});


// ast_Compare
BlockMirrorTextToBlocks.COMPARES = [
    ["==", "Eq", 'Return whether the two values are equal.'],
    ["!=", "NotEq", 'Return whether the two values are not equal.'],
    ["<", "Lt", 'Return whether the left value is less than the right value.'],
    ["<=", "LtE", 'Return whether the left value is less than or equal to the right value.'],
    [">", "Gt", 'Return whether the left value is greater than the right value.'],
    [">=", "GtE", 'Return whether the left value is greater than or equal to the right value.'],
    ["is", "Is", 'Return whether the left value is identical to the right value.'],
    ["is not", "IsNot", 'Return whether the left value is not identical to the right value.'],
    ["in", "In", 'Return whether the left value is in the right value.'],
    ["not in", "NotIn", 'Return whether the left value is not in the right value.'],
];

var COMPARES_BLOCKLY_DISPLAY = BlockMirrorTextToBlocks.COMPARES.map(
    boolop => [boolop[0], boolop[1]]
);
var COMPARES_BLOCKLY_GENERATE = {};
BlockMirrorTextToBlocks.COMPARES.forEach(function (boolop) {
    COMPARES_BLOCKLY_GENERATE[boolop[1]] = boolop[0];
});

BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_Compare",
    "message0": "%1 %2 %3",
    "args0": [
        { "type": "input_value", "name": "A" },
        { "type": "field_dropdown", "name": "OP", "options": COMPARES_BLOCKLY_DISPLAY },
        { "type": "input_value", "name": "B" }
    ],
    "inputsInline": true,
    "output": null,
    "colour": BlockMirrorTextToBlocks.COLOR.LOGIC
});

BlockMirrorTextToBlocks.prototype['ast_Compare'] = function (node, parent) {
    var ops = node.ops;
    var left = node.left;
    var values = node.comparators;
    var result_block = this.convert(left, node);
    for (var i = 0; i < values.length; i += 1) {
        result_block = BlockMirrorTextToBlocks.create_block("ast_Compare", node.lineno, {
            "OP": ops[i].name
        }, {
            "A": result_block,
            "B": this.convert(values[i], node)
        }, {
            "inline": "true"
        });
    }
    return result_block;
};


// ast_Continue
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_Continue",
    "message0": "continue",
    "inputsInline": false,
    "previousStatement": null,
    "nextStatement": null,
    "colour": BlockMirrorTextToBlocks.COLOR.CONTROL,
});


BlockMirrorTextToBlocks.prototype['ast_Continue'] = function (node, parent) {
    return BlockMirrorTextToBlocks.create_block("ast_Continue", node.lineno);
};

BlockMirrorTextToBlocks.prototype['ast_Delete'] = function (node, parent) {
    let targets = node.targets;

    return BlockMirrorTextToBlocks.create_block("ast_Delete", node.lineno, {},
        this.convertElements("TARGET", targets, node),
        {
            "inline": "true",
        }, {
        "@targets": targets.length
    });
};


BlockMirrorTextToBlocks.prototype['ast_Dict'] = function (node, parent) {
    let keys = node.keys;
    let values = node.values;

    if (keys === null) {
        return BlockMirrorTextToBlocks.create_block("ast_Dict", node.lineno, {},
            {}, { "inline": "false" }, { "@items": 0 });
    }

    let elements = {};
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let value = values[i];
        elements["ADD" + i] = BlockMirrorTextToBlocks.create_block("ast_DictItem", node.lineno, {},
            {
                "KEY": this.convert(key, node),
                "VALUE": this.convert(value, node)
            },
            this.LOCKED_BLOCK);
    }

    return BlockMirrorTextToBlocks.create_block("ast_Dict", node.lineno, {},
        elements,
        {
            "inline": "false"
        }, {
        "@items": keys.length
    });
}






// ast_Expr
// BlockMirrorTextToBlocks.BLOCKS.push({
//     "type": "ast_Expr",
//     "message0": "%1",
//     "args0": [
//         { "type": "input_value", "name": "VALUE" }
//     ],
//     "inputsInline": false,
//     "previousStatement": null,
//     "nextStatement": null,
//     "colour": BlockMirrorTextToBlocks.COLOR.PYTHON,
// });

BlockMirrorTextToBlocks.prototype['ast_Expr'] = function (node, parent) {
    var value = node.value;

    var converted = this.convert(value, node);

    if (converted.constructor === Array) {
        return converted[0];
    } else if (this.isTopLevel(parent)) {
        return [this.convert(value, node)];
    } else {
        return BlockMirrorTextToBlocks.create_block("ast_Expr", node.lineno, {}, {
            "VALUE": this.convert(value, node)
        });
    }
};


// ast_For
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_For",
    "message0": "for each item %1 in list %2 : %3 %4",
    "args0": [
        { "type": "input_value", "name": "TARGET" },
        { "type": "input_value", "name": "ITER" },
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "BODY" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": BlockMirrorTextToBlocks.COLOR.CONTROL,
})

BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_ForElse",
    "message0": "for each item %1 in list %2 : %3 %4 else: %5 %6",
    "args0": [
        { "type": "input_value", "name": "TARGET" },
        { "type": "input_value", "name": "ITER" },
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "BODY" },
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "ELSE" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": BlockMirrorTextToBlocks.COLOR.CONTROL,
})

BlockMirrorTextToBlocks.prototype['ast_For'] = function (node, parent) {
    var target = node.target;
    var iter = node.iter;
    var body = node.body;
    var orelse = node.orelse;

    var blockName = 'ast_For';
    var bodies = { 'BODY': this.convertBody(body, node) };

    if (orelse.length > 0) {
        blockName = "ast_ForElse";
        bodies['ELSE'] = this.convertBody(orelse, node);
    }

    return BlockMirrorTextToBlocks.create_block(blockName, node.lineno, {
    }, {
        "ITER": this.convert(iter, node),
        "TARGET": this.convert(target, node)
    }, {}, {}, bodies);
}

BlockMirrorTextToBlocks.prototype['ast_ForElse'] = BlockMirrorTextToBlocks.prototype['ast_For'];


// ast_FunctionDef
// TODO: what if a user deletes a parameter through the context menu?

// The mutator container
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_FunctionHeaderMutator",
    "message0": "Setup parameters below: %1 %2 returns %3",
    "args0": [
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "STACK", "align": "RIGHT" },
        { "type": "field_checkbox", "name": "RETURNS", "checked": true, "align": "RIGHT" }
    ],
    "colour": BlockMirrorTextToBlocks.COLOR.FUNCTIONS,
    "enableContextMenu": false
});

// The elements you can put into the mutator
[
    ['Parameter', 'Parameter', '', false, false],
    ['ParameterType', 'Parameter with type', '__', true, false],
    ['ParameterDefault', 'Parameter with default value', '__', false, true],
    ['ParameterDefaultType', 'Parameter with type and default value', '__', true, true],
    ['ParameterVararg', 'Variable length parameter', '*', false, false],
    ['ParameterVarargType', 'Variable length parameter with type', '*', true, false],
    ['ParameterKwarg', 'Keyworded Variable length parameter', '**', false],
    ['ParameterKwargType', 'Keyworded Variable length parameter with type', '**', true, false],
].forEach(function (parameterTypeTuple) {
    let parameterType = parameterTypeTuple[0],
        parameterDescription = parameterTypeTuple[1],
        parameterPrefix = parameterTypeTuple[2],
        parameterTyped = parameterTypeTuple[3],
        parameterDefault = parameterTypeTuple[4];
    BlockMirrorTextToBlocks.BLOCKS.push({
        "type": "ast_FunctionMutant" + parameterType,
        "message0": parameterDescription,
        "previousStatement": null,
        "nextStatement": null,
        "colour": BlockMirrorTextToBlocks.COLOR.FUNCTIONS,
        "enableContextMenu": false
    });
    let realParameterBlock = {
        "type": "ast_Function" + parameterType,
        "output": "Parameter",
        "message0": parameterPrefix + (parameterPrefix ? ' ' : ' ') + "%1",
        "args0": [{ "type": "field_variable", "name": "NAME", "variable": "param" }],
        "colour": BlockMirrorTextToBlocks.COLOR.FUNCTIONS,
        "enableContextMenu": false,
        "inputsInline": (parameterTyped && parameterDefault),
    };
    if (parameterTyped) {
        realParameterBlock['message0'] += " : %2";
        realParameterBlock['args0'].push({ "type": "input_value", "name": "TYPE" });
    }
    if (parameterDefault) {
        realParameterBlock['message0'] += " = %" + (parameterTyped ? 3 : 2);
        realParameterBlock['args0'].push({ "type": "input_value", "name": "DEFAULT" });
    }
    BlockMirrorTextToBlocks.BLOCKS.push(realParameterBlock);
});

// TODO: Figure out an elegant "complexity" flag feature to allow different levels of Mutators

BlockMirrorTextToBlocks.prototype.parseArg = function (arg, type, lineno, values, node) {
    let settings = {
        "movable": false,
        "deletable": false
    };
    if (arg.annotation === null) {
        return BlockMirrorTextToBlocks.create_block(type,
            lineno, { 'NAME': Sk.ffi.remapToJs(arg.arg) }, values, settings);
    } else {
        values['TYPE'] = this.convert(arg.annotation, node);
        return BlockMirrorTextToBlocks.create_block(type + "Type",
            lineno, { 'NAME': Sk.ffi.remapToJs(arg.arg) }, values, settings);
    }
};

BlockMirrorTextToBlocks.prototype.parseArgs = function (args, values, lineno, node) {
    let positional = args.args,
        vararg = args.vararg,
        kwonlyargs = args.kwonlyargs,
        kwarg = args.kwarg,
        defaults = args.defaults,
        kw_defaults = args.kw_defaults;
    let totalArgs = 0;
    // args (positional)
    if (positional !== null) {
        // "If there are fewer defaults, they correspond to the last n arguments."
        let defaultOffset = defaults ? defaults.length - positional.length : 0;
        for (let i = 0; i < positional.length; i++) {
            let childValues = {};
            let type = 'ast_FunctionParameter';
            if (defaults[defaultOffset + i]) {
                childValues['DEFAULT'] = this.convert(defaults[defaultOffset + i], node);
                type += "Default";
            }
            values['PARAMETER' + totalArgs] = this.parseArg(positional[i], type, lineno, childValues, node);
            totalArgs += 1;
        }
    }
    // *arg
    if (vararg !== null) {
        values['PARAMETER' + totalArgs] = this.parseArg(vararg, 'ast_FunctionParameterVararg', lineno, {}, node);
        totalArgs += 1;
    }
    // keyword arguments that must be referenced by name
    if (kwonlyargs !== null) {
        for (let i = 0; i < kwonlyargs.length; i++) {
            let childValues = {};
            let type = 'ast_FunctionParameter';
            if (kw_defaults[i]) {
                childValues['DEFAULT'] = this.convert(kw_defaults[i], node);
                type += "Default";
            }
            values['PARAMETER' + totalArgs] = this.parseArg(kwonlyargs[i], type, lineno, childValues, node);
            totalArgs += 1;
        }
    }
    // **kwarg
    if (kwarg) {
        values['PARAMETER' + totalArgs] = this.parseArg(kwarg, 'ast_FunctionParameterKwarg', lineno, {}, node);
        totalArgs += 1;
    }

    return totalArgs;
};

BlockMirrorTextToBlocks.prototype['ast_FunctionDef'] = function (node, parent) {
    let name = node.name;
    let args = node.args;
    let body = node.body;
    let decorator_list = node.decorator_list;
    let returns = node.returns;

    let values = {};

    if (decorator_list !== null) {
        for (let i = 0; i < decorator_list.length; i++) {
            values['DECORATOR' + i] = this.convert(decorator_list[i], node);
        }
    }

    let parsedArgs = 0;
    if (args !== null) {
        parsedArgs = this.parseArgs(args, values, node.lineno, node);
    }

    let hasReturn = (returns !== null &&
        (returns._astname !== 'NameConstant' || returns.value !== Sk.builtin.none.none$));
    if (hasReturn) {
        values['RETURNS'] = this.convert(returns, node);
    }

    return BlockMirrorTextToBlocks.create_block("ast_FunctionDef", node.lineno, {
        'NAME': Sk.ffi.remapToJs(name)
    },
        values,
        {
            "inline": "false"
        }, {
        "@decorators": (decorator_list === null ? 0 : decorator_list.length),
        "@parameters": parsedArgs,
        "@returns": hasReturn,
    }, {
        'BODY': this.convertBody(body, node)
    });
};


// ast_functions
BlockMirrorTextToBlocks['ast_Image'] = function (node, parent, bmttb) {
    if (!bmttb.blockMirror.configuration.imageMode) {
        throw "Not using image constructor";
    }
    if (node.args.length !== 1) {
        throw "More than one argument to Image constructor";
    }
    if (node.args[0]._astname !== "Str") {
        throw "First argument for Image constructor must be string literal";
    }
    return BlockMirrorTextToBlocks.create_block("ast_Image", node.lineno, {}, {}, {},
        { "@src": Sk.ffi.remapToJs(node.args[0].s) });
};


BlockMirrorTextToBlocks.prototype.FUNCTION_SIGNATURES = {
    'abs': {
        'returns': true,
        'full': ['x'], colour: BlockMirrorTextToBlocks.COLOR.MATH
    },
    'all': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.LOGIC },
    'any': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.LOGIC },
    'ascii': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'bin': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'bool': {
        returns: true, colour: BlockMirrorTextToBlocks.COLOR.LOGIC,
        simple: ['x']
    },
    'breakpoint': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.PYTHON },
    'bytearray': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'bytes': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'callable': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.LOGIC },
    'chr': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'classmethod': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.OO },
    'compile': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.PYTHON },
    'complex': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'delattr': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.VARIABLES },
    'dict': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.DICTIONARY },
    'dir': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.PYTHON },
    'divmod': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'enumerate': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES },
    'eval': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.PYTHON },
    'exec': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.PYTHON },
    'filter': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES },
    'float': {
        returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH,
        simple: ['x']
    },
    'format': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'frozenset': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES },
    'getattr': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.OO },
    'globals': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.VARIABLES },
    'hasattr': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.OO },
    'hash': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'help': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.PYTHON },
    'hex': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'id': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.PYTHON },
    'Image': { custom: BlockMirrorTextToBlocks.ast_Image },
    'input': {
        returns: true, colour: BlockMirrorTextToBlocks.COLOR.FILE,
        simple: ['prompt']
    },
    'int': {
        returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH,
        simple: ['x']
    },
    'isinstance': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.LOGIC },
    'issubclass': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.LOGIC },
    'iter': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES },
    'len': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES },
    'list': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.LIST },
    'locals': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.VARIABLES },
    'map': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES },
    'max': {
        returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH,
        simple: ['x']
    },
    'memoryview': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.PYTHON },
    'min': {
        returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH,
        simple: ['x']
    },
    'next': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES },
    'object': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.OO },
    'oct': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'open': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.FILE },
    'ord': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'pow': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'print': {
        returns: false, colour: BlockMirrorTextToBlocks.COLOR.FILE,
        simple: ['message'], full: ['*messages', 'sep', 'end', 'file', 'flush']
    },
    'property': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.OO },
    'range': {
        returns: true, colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES,
        simple: ['stop'], full: ['start', 'stop', 'step']
    },
    'repr': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'reversed': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES },
    'round': {
        returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH,
        full: ['x', 'ndigits'],
        simple: ['x']
    },
    'set': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SET },
    'setattr': {
        'returns': false,
        'full': ['object', 'name', 'value'], colour: BlockMirrorTextToBlocks.COLOR.OO
    },
    'slice': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES },
    'sorted': {
        'full': ['iterable', '*', '**key', '**reverse'],
        'simple': ['iterable'],
        'returns': true,
        colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES
    },
    'staticmethod': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.OO },
    'str': {
        returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT,
        simple: ['x']
    },
    'sum': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'super': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.OO },
    'tuple': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TUPLE },
    'type': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.OO },
    'vars': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.VARIABLES },
    'zip': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES },
    '__import__': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.PYTHON }


};

BlockMirrorTextToBlocks.prototype.METHOD_SIGNATURES = {
    'conjugate': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'trunc': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'floor': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'ceil': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'bit_length': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'to_bytes': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'from_bytes': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'as_integer_ratio': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'is_integer': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'hex': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    'fromhex': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.MATH },
    '__iter__': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES },
    '__next__': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES },
    'index': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.LIST },
    'count': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.LIST },
    'append': {
        'returns': false,
        'full': ['x'],
        'message': 'append',
        'premessage': 'to list', colour: BlockMirrorTextToBlocks.COLOR.LIST
    },
    'clear': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES },
    'copy': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.LIST },
    'extend': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.LIST },
    'insert': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.LIST },
    'pop': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES },
    'remove': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.SEQUENCES },
    'reverse': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.LIST },
    'sort': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.LIST },
    'capitalize': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'casefold': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'center': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'encode': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'endswith': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'expandtabs': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'find': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'format': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'format_map': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'isalnum': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'isalpha': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'isascii': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'isdecimal': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'isdigit': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'isidentifier': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'islower': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'isnumeric': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'isprintable': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'isspace': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'istitle': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'isupper': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'join': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'ljust': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'lower': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'lstrip': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'maketrans': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'partition': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'replace': {
        'returns': true,
        'full': ['old', 'new', 'count'],
        'simple': ['old', 'new'], colour: BlockMirrorTextToBlocks.COLOR.TEXT
    },
    'rfind': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'rindex': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'rjust': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'rpartition': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'rsplit': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'rstrip': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'split': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'splitlines': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'startswith': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'strip': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'swapcase': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'title': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'translate': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'upper': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'zfill': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    'decode': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.TEXT },
    '__eq__': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.LOGIC },
    'tobytes': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.PYTHON },
    'tolist': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.PYTHON },
    'release': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.PYTHON },
    'cast': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.PYTHON },
    'isdisjoint': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SET },
    'issubset': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SET },
    'issuperset': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SET },
    'union': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SET },
    'intersection': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SET },
    'difference': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SET },
    'symmetric_difference': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.SET },
    'update': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.SET },
    'intersection_update': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.SET },
    'difference_update': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.SET },
    'symmetric_difference_update': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.SET },
    'add': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.SET },
    'discard': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.SET },
    'fromkeys': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.DICTIONARY },
    'get': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.DICTIONARY },
    'items': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.DICTIONARY },
    'keys': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.DICTIONARY },
    'popitem': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.DICTIONARY },
    'setdefault': { returns: false, colour: BlockMirrorTextToBlocks.COLOR.DICTIONARY },
    'values': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.DICTIONARY },
    '__enter__': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.CONTROL },
    '__exit__': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.CONTROL },
    'mro': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.OO },
    '__subclasses__': { returns: true, colour: BlockMirrorTextToBlocks.COLOR.OO },
};


BlockMirrorTextToBlocks.prototype.MODULE_FUNCTION_IMPORTS = {
    "plt": "import matplotlib.pyplot as plt",
    "turtle": "import turtle"
};

BlockMirrorTextToBlocks.prototype.MODULE_FUNCTION_SIGNATURES = {
    "cisc108": {
        'assert_equal': {
            returns: false,
            simple: ["left", "right"],
            message: "assert_equal",
            colour: BlockMirrorTextToBlocks.COLOR.PYTHON
        }
    },
    "turtle": {},
    'plt': {
        'show': {
            returns: false,
            simple: [],
            message: 'show plot canvas',
            colour: BlockMirrorTextToBlocks.COLOR.PLOTTING
        },
        'hist': {
            returns: false,
            simple: ['values'],
            message: 'plot histogram',
            colour: BlockMirrorTextToBlocks.COLOR.PLOTTING
        },
        'bar': {
            returns: false,
            simple: ['xs', 'heights', '*tick_label'],
            message: 'plot bar chart',
            colour: BlockMirrorTextToBlocks.COLOR.PLOTTING
        },
        'plot': {
            returns: false,
            simple: ['values'],
            message: 'plot line',
            colour: BlockMirrorTextToBlocks.COLOR.PLOTTING
        },
        'boxplot': {
            returns: false,
            simple: ['values'],
            message: 'plot boxplot',
            colour: BlockMirrorTextToBlocks.COLOR.PLOTTING
        },
        'hlines': {
            returns: false,
            simple: ['y', 'xmin', 'xmax'],
            message: 'plot horizontal line',
            colour: BlockMirrorTextToBlocks.COLOR.PLOTTING
        },
        'vlines': {
            returns: false,
            simple: ['x', 'ymin', 'ymax'],
            message: 'plot vertical line',
            colour: BlockMirrorTextToBlocks.COLOR.PLOTTING
        },
        'scatter': {
            returns: false,
            simple: ['xs', 'ys'],
            message: 'plot scatter',
            colour: BlockMirrorTextToBlocks.COLOR.PLOTTING
        },
        'title': {
            returns: false,
            simple: ['label'],
            message: "make plot's title",
            colour: BlockMirrorTextToBlocks.COLOR.PLOTTING
        },
        'xlabel': {
            returns: false,
            simple: ['label'],
            message: "make plot's x-axis label",
            colour: BlockMirrorTextToBlocks.COLOR.PLOTTING
        },
        'ylabel': {
            returns: false,
            simple: ['label'],
            message: "make plot's y-axis label",
            colour: BlockMirrorTextToBlocks.COLOR.PLOTTING
        },
        'xticks': {
            returns: false,
            simple: ['xs', 'labels', '*rotation'],
            message: "make x ticks",
            colour: BlockMirrorTextToBlocks.COLOR.PLOTTING
        },
        'yticks': {
            returns: false,
            simple: ['ys', 'labels', '*rotation'],
            message: "make y ticks",
            colour: BlockMirrorTextToBlocks.COLOR.PLOTTING
        }
    }
};

BlockMirrorTextToBlocks.prototype.FUNCTION_SIGNATURES['assert_equal'] =
    BlockMirrorTextToBlocks.prototype.MODULE_FUNCTION_SIGNATURES['cisc108']['assert_equal'];

function makeTurtleBlock(name, returns, values, message, aliases) {
    BlockMirrorTextToBlocks.prototype.MODULE_FUNCTION_SIGNATURES['turtle'][name] = {
        "returns": returns,
        "simple": values,
        "message": message,
        colour: BlockMirrorTextToBlocks.COLOR.PLOTTING
    };
    if (aliases) {
        aliases.forEach(function (alias) {
            BlockMirrorTextToBlocks.prototype.MODULE_FUNCTION_SIGNATURES['turtle'][alias] =
                BlockMirrorTextToBlocks.prototype.MODULE_FUNCTION_SIGNATURES['turtle'][name];
        });
    }
}

makeTurtleBlock("forward", false, ["amount"], "move turtle forward by", ["fd"]);
makeTurtleBlock("backward", false, ["amount"], "move turtle backward by", ["bd"]);
makeTurtleBlock("right", false, ["angle"], "turn turtle right by", ["rt"]);
makeTurtleBlock("left", false, ["angle"], "turn turtle left by", ["lt"]);
makeTurtleBlock("goto", false, ["x", "y"], "move turtle to position", ["setpos", "setposition"]);
makeTurtleBlock("setx", false, ["x"], "set turtle's x position to ", []);
makeTurtleBlock("sety", false, ["y"], "set turtle's y position to ", []);
makeTurtleBlock("setheading", false, ["angle"], "set turtle's heading to ", ["seth"]);
makeTurtleBlock("home", false, [], "move turtle to origin ", []);
makeTurtleBlock("circle", false, ["radius"], "move the turtle in a circle ", []);
makeTurtleBlock("dot", false, ["size", "color"], "turtle draws a dot ", []);
makeTurtleBlock("stamp", true, [], "stamp a copy of the turtle shape ", []);
makeTurtleBlock("clearstamp", false, ["stampid"], "delete stamp with id ", []);
makeTurtleBlock("clearstamps", false, [], "delete all stamps ", []);
makeTurtleBlock("undo", false, [], "undo last turtle action ", []);
makeTurtleBlock("speed", true, ["x"], "set or get turtle speed", []);
makeTurtleBlock("position", true, [], "get turtle's position ", ["pos"]);
makeTurtleBlock("towards", true, ["x", "y"], "get the angle from the turtle to the point ", []);
makeTurtleBlock("xcor", true, [], "get turtle's x position ", []);
makeTurtleBlock("ycor", true, [], "get turtle's y position ", []);
makeTurtleBlock("heading", true, [], "get turtle's heading ", []);
makeTurtleBlock("distance", true, ["x", "y"], "get the distance from turtle's position to ", []);
makeTurtleBlock("degrees", false, [], "set turtle mode to degrees", []);
makeTurtleBlock("radians", false, [], "set turtle mode to radians", []);
makeTurtleBlock("pendown", false, [], "pull turtle pen down ", ["pd", "down"]);
makeTurtleBlock("penup", false, [], "pull turtle pen up ", ["pu", "up"]);
// Skipped some
makeTurtleBlock("pensize", false, [], "set or get the pen size ", ["width"]);
// Skipped some
makeTurtleBlock("pencolor", false, [], "set or get the pen color ", []);
makeTurtleBlock("fillcolor", false, [], "set or get the fill color ", []);
makeTurtleBlock("reset", false, [], "reset drawing", []);
makeTurtleBlock("clear", false, [], "clear drawing", []);
makeTurtleBlock("write", false, ["message"], "write text ", []);
// Skipped some
makeTurtleBlock("bgpic", false, ["url"], "set background to ", []);
makeTurtleBlock("done", false, [], "start the turtle loop ", ["mainloop"]);
makeTurtleBlock("setup", false, ["width", "height"], "set drawing area size ", []);
makeTurtleBlock("title", false, ["message"], "set title of drawing area ", []);
makeTurtleBlock("bye", false, [], "say goodbye to turtles ", []);


BlockMirrorTextToBlocks.prototype.MODULE_FUNCTION_SIGNATURES['matplotlib.pyplot'] =
    BlockMirrorTextToBlocks.prototype.MODULE_FUNCTION_SIGNATURES['plt'];

BlockMirrorTextToBlocks.getFunctionBlock = function (name, values, module) {
    if (values === undefined) {
        values = {};
    }
    // TODO: hack, we shouldn't be accessing the prototype like this
    let signature;
    let method = false;
    if (module !== undefined) {
        signature = BlockMirrorTextToBlocks.prototype.MODULE_FUNCTION_SIGNATURES[module][name];
    } else if (name.startsWith('.')) {
        signature = BlockMirrorTextToBlocks.prototype.METHOD_SIGNATURES[name.substr(1)];
        method = true;
    } else {
        signature = BlockMirrorTextToBlocks.prototype.FUNCTION_SIGNATURES[name];
    }
    let args = (signature.simple !== undefined ? signature.simple :
        signature.full !== undefined ? signature.full : []);
    let argumentsMutation = {
        "@arguments": args.length,
        "@returns": (signature.returns || false),
        "@parameters": true,
        "@method": method,
        "@name": module ? module + "." + name : name,
        "@message": signature.message ? signature.message : name,
        "@premessage": signature.premessage ? signature.premessage : "",
        "@colour": signature.colour ? signature.colour : 0,
        "@module": module || ""
    };
    for (let i = 0; i < args.length; i += 1) {
        argumentsMutation["UNKNOWN_ARG:" + i] = null;
    }
    let newBlock = BlockMirrorTextToBlocks.create_block("ast_Call", null, {},
        values, { inline: true }, argumentsMutation);
    // Return as either statement or expression
    return BlockMirrorTextToBlocks.xmlToString(newBlock);
};

BlockMirrorTextToBlocks.prototype['ast_Global'] = function (node, parent) {
    let names = node.names;

    let fields = {};
    for (var i = 0; i < names.length; i++) {
        fields["NAME" + i] = Sk.ffi.remapToJs(names[i]);
    }

    return BlockMirrorTextToBlocks.create_block("ast_Global", node.lineno,
        fields,
        {}, {
        "inline": "true",
    }, {
        "@names": names.length
    });
};


BlockMirrorTextToBlocks.prototype['ast_If'] = function (node, parent) {
    let test = node.test;
    let body = node.body;
    let orelse = node.orelse;

    let hasOrelse = false;
    let elifCount = 0;

    let values = { "TEST": this.convert(test, node) };
    let statements = { "BODY": this.convertBody(body, node) };

    while (orelse !== undefined && orelse.length > 0) {
        if (orelse.length === 1) {
            if (orelse[0]._astname === "If") {
                // This is an ELIF
                this.heights.shift();
                values['ELIFTEST' + elifCount] = this.convert(orelse[0].test, node);
                statements['ELIFBODY' + elifCount] = this.convertBody(orelse[0].body, node);
                elifCount++;
            } else {
                hasOrelse = true;
                statements['ORELSEBODY'] = this.convertBody(orelse, node);
            }
        } else {
            hasOrelse = true;
            statements['ORELSEBODY'] = this.convertBody(orelse, node);
        }
        orelse = orelse[0].orelse;
    }

    return BlockMirrorTextToBlocks.create_block("ast_If", node.lineno, {},
        values, {}, {
        "@orelse": hasOrelse,
        "@elifs": elifCount
    }, statements);
};


// ast_IfExp
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_IfExp",
    "message0": "%1 if %2 else %3",
    "args0": [
        { "type": "input_value", "name": "BODY" },
        { "type": "input_value", "name": "TEST" },
        { "type": "input_value", "name": "ORELSE" }
    ],
    "inputsInline": true,
    "output": null,
    "colour": BlockMirrorTextToBlocks.COLOR.LOGIC
});

BlockMirrorTextToBlocks.prototype['ast_IfExp'] = function (node, parent) {
    let test = node.test;
    let body = node.body;
    let orelse = node.orelse;

    return BlockMirrorTextToBlocks.create_block("ast_IfExp", node.lineno, {}, {
        "TEST": this.convert(test, node),
        "BODY": this.convert(body, node),
        "ORELSE": this.convert(orelse, node)
    });
};


// ast_Import
// TODO: direct imports are not variables, because you can do stuff like:
//         import os.path
//       What should the variable be? Blockly will mangle it, but we should really be
//       doing something more complicated here with namespaces (probably make `os` the
//       variable and have some kind of list of attributes. But that's in the fading zone.

BlockMirrorTextToBlocks.prototype['ast_Import'] = function (node, parent) {
    let names = node.names;

    let fields = {};
    let mutations = { '@names': names.length };

    let regulars = [];
    let simpleName = "";
    for (let i = 0; i < names.length; i++) {
        fields["NAME" + i] = Sk.ffi.remapToJs(names[i].name);
        let isRegular = (names[i].asname === null);
        if (!isRegular) {
            fields["ASNAME" + i] = Sk.ffi.remapToJs(names[i].asname);
            simpleName = fields["ASNAME" + i];
        } else {
            simpleName = fields["NAME" + i];
        }
        regulars.push(isRegular);
    }
    mutations['regular'] = regulars;

    if (this.hiddenImports.indexOf(simpleName) !== -1) {
        return null;
    }

    if (node._astname === 'ImportFrom') {
        // acbart: GTS suggests module can be None for '.' but it's an empty string in Skulpt
        mutations['@from'] = true;
        fields['MODULE'] = ('.'.repeat(node.level)) + Sk.ffi.remapToJs(node.module);
    } else {
        mutations['@from'] = false;
    }

    return BlockMirrorTextToBlocks.create_block("ast_Import", node.lineno, fields,
        {}, { "inline": true }, mutations);
};

// Alias ImportFrom because of big overlap
BlockMirrorTextToBlocks.prototype['ast_ImportFrom'] = BlockMirrorTextToBlocks.prototype['ast_Import'];

BlockMirrorTextToBlocks.prototype['ast_Lambda'] = function (node, parent) {
    let args = node.args;
    let body = node.body;

    let values = { 'BODY': this.convert(body, node) };

    let parsedArgs = 0;
    if (args !== null) {
        parsedArgs = this.parseArgs(args, values, node.lineno);
    }

    return BlockMirrorTextToBlocks.create_block("ast_Lambda", node.lineno, {},
        values,
        {
            "inline": "false"
        }, {
        "@decorators": 0,
        "@parameters": parsedArgs,
        "@returns": false,
    });
};

BlockMirrorTextToBlocks.prototype['ast_List'] = function (node, parent) {
    var elts = node.elts;
    var ctx = node.ctx;

    return BlockMirrorTextToBlocks.create_block("ast_List", node.lineno, {},
        this.convertElements("ADD", elts, node),
        {
            "inline": elts.length > 3 ? "false" : "true",
        }, {
        "@items": elts.length
    });
}





// ast_Name
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_Name",
    "message0": "%1",
    "args0": [
        { "type": "field_variable", "name": "VAR", "variable": "%{BKY_VARIABLES_DEFAULT_NAME}" }
    ],
    "output": null,
    "colour": BlockMirrorTextToBlocks.COLOR.VARIABLES,
    "extensions": ["contextMenu_variableSetterGetter_forBlockMirror"]
})

/**
 * Mixin to add context menu items to create getter/setter blocks for this
 * setter/getter.
 * Used by blocks 'ast_Name' and 'ast_Assign'.
 * @mixin
 * @augments Blockly.Block
 * @package
 * @readonly
 */
const CUSTOM_CONTEXT_MENU_VARIABLE_GETTER_SETTER_MIXIN_FOR_BLOCK_MIRROR = {
    /**
     * Add menu option to create getter/setter block for this setter/getter.
     * @param {!Array} options List of menu options to add to.
     * @this Blockly.Block
     */
    customContextMenu: function (options) {
        let name;
        if (!this.isInFlyout) {
            // Getter blocks have the option to create a setter block, and vice versa.
            let opposite_type, contextMenuMsg;
            if (this.type === 'ast_Name') {
                opposite_type = 'ast_Assign';
                contextMenuMsg = Blockly.Msg['VARIABLES_GET_CREATE_SET'];
            } else {
                opposite_type = 'ast_Name';
                contextMenuMsg = Blockly.Msg['VARIABLES_SET_CREATE_GET'];
            }

            var option = { enabled: this.workspace.remainingCapacity() > 0 };
            name = this.getField('VAR').getText();
            option.text = contextMenuMsg.replace('%1', name);
            var xmlField = document.createElement('field');
            xmlField.setAttribute('name', 'VAR');
            xmlField.appendChild(document.createTextNode(name));
            var xmlBlock = document.createElement('block');
            xmlBlock.setAttribute('type', opposite_type);
            xmlBlock.appendChild(xmlField);
            option.callback = Blockly.ContextMenu.callbackFactory(this, xmlBlock);
            options.push(option);
            // Getter blocks have the option to rename or delete that variable.
        } else {
            if (this.type === 'ast_Name' || this.type === 'variables_get_reporter') {
                var renameOption = {
                    text: Blockly.Msg.RENAME_VARIABLE,
                    enabled: true,
                    // callback: Blockly.Constants.Variables.RENAME_OPTION_CALLBACK_FACTORY(this)
                };
                name = this.getField('VAR').getText();
                var deleteOption = {
                    text: Blockly.Msg.DELETE_VARIABLE.replace('%1', name),
                    enabled: true,
                    // callback: Blockly.Constants.Variables.DELETE_OPTION_CALLBACK_FACTORY(this)
                };
                options.unshift(renameOption);
                options.unshift(deleteOption);
            }
        }
    }
};

// Blockly.Extensions.registerMixin('contextMenu_variableSetterGetter_forBlockMirror', CUSTOM_CONTEXT_MENU_VARIABLE_GETTER_SETTER_MIXIN_FOR_BLOCK_MIRROR);

BlockMirrorTextToBlocks.prototype['ast_Name'] = function (node, parent) {
    var id = node.id;
    var ctx = node.ctx;
    if (id.v == '__') {
        return null;
    } else {
        return BlockMirrorTextToBlocks.create_block('ast_Name', node.lineno, {
            "VAR": id.v
        });
    }
}



// ast_NameConstant
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_NameConstantNone",
    "message0": "None",
    "args0": [],
    "output": "None",
    "colour": BlockMirrorTextToBlocks.COLOR.LOGIC
});

BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_NameConstantBoolean",
    "message0": "%1",
    "args0": [
        {
            "type": "field_dropdown", "name": "BOOL", "options": [
                ["True", "TRUE"],
                ["False", "FALSE"]
            ]
        }
    ],
    "output": "Boolean",
    "colour": BlockMirrorTextToBlocks.COLOR.LOGIC
});

BlockMirrorTextToBlocks.prototype['ast_NameConstant'] = function (node, parent) {
    let value = node.value;

    if (value === Sk.builtin.none.none$) {
        return BlockMirrorTextToBlocks.create_block('ast_NameConstantNone', node.lineno, {});
    } else if (value === Sk.builtin.bool.true$) {
        return BlockMirrorTextToBlocks.create_block('ast_NameConstantBoolean', node.lineno, {
            "BOOL": 'TRUE'
        });
    } else if (value === Sk.builtin.bool.false$) {
        return BlockMirrorTextToBlocks.create_block('ast_NameConstantBoolean', node.lineno, {
            "BOOL": 'FALSE'
        });
    }
};

BlockMirrorTextToBlocks.prototype['ast_Nonlocal'] = function (node, parent) {
    let names = node.names;

    let fields = {};
    for (var i = 0; i < names.length; i++) {
        fields["NAME" + i] = Sk.ffi.remapToJs(names[i]);
    }

    return BlockMirrorTextToBlocks.create_block("ast_Nonlocal", node.lineno,
        fields,
        {}, {
        "inline": "true",
    }, {
        "@names": names.length
    });
};


// ast_Num
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_Num",
    "message0": "%1",
    "args0": [
        { "type": "field_number", "name": "NUM", "value": 0 }
    ],
    "output": "Number",
    "colour": BlockMirrorTextToBlocks.COLOR.MATH
})

BlockMirrorTextToBlocks.prototype['ast_Num'] = function (node, parent) {
    var n = node.n;
    return BlockMirrorTextToBlocks.create_block("ast_Num", node.lineno, {
        "NUM": Sk.ffi.remapToJs(n)
    });
}

BlockMirrorTextToBlocks.prototype['ast_Raise'] = function (node, parent) {
    var exc = node.exc;
    var cause = node.cause;
    let values = {};
    let hasExc = false, hasCause = false;
    if (exc !== null) {
        values['EXC'] = this.convert(exc, node);
        hasExc = true;
    }
    if (cause !== null) {
        values['CAUSE'] = this.convert(cause, node);
        hasCause = true;
    }
    return BlockMirrorTextToBlocks.create_block("ast_Raise", node.lineno, {}, values, {}, {
        '@exc': hasExc,
        '@cause': hasCause
    });
};



// ast_Return
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_ReturnFull",
    "message0": "return %1",
    "args0": [
        { "type": "input_value", "name": "VALUE" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": BlockMirrorTextToBlocks.COLOR.FUNCTIONS,
});

BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_Return",
    "message0": "return",
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": BlockMirrorTextToBlocks.COLOR.FUNCTIONS,
});

BlockMirrorTextToBlocks.prototype['ast_Return'] = function (node, parent) {
    let value = node.value;

    if (value == null) {
        return BlockMirrorTextToBlocks.create_block("ast_Return", node.lineno);
    } else {
        return BlockMirrorTextToBlocks.create_block("ast_ReturnFull", node.lineno, {}, {
            "VALUE": this.convert(value, node)
        });
    }
};


BlockMirrorTextToBlocks.prototype['ast_Set'] = function (node, parent) {
    var elts = node.elts;

    return BlockMirrorTextToBlocks.create_block("ast_Set", node.lineno, {},
        this.convertElements("ADD", elts, node),
        {
            "inline": elts.length > 3 ? "false" : "true",
        }, {
        "@items": elts.length
    });
}


// ast_Starred
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": 'ast_Starred',
    "message0": "*%1",
    "args0": [
        { "type": "input_value", "name": "VALUE" }
    ],
    "inputsInline": false,
    "output": null,
    "colour": BlockMirrorTextToBlocks.COLOR.VARIABLES
});

BlockMirrorTextToBlocks.prototype['ast_Starred'] = function (node, parent) {
    let value = node.value;
    let ctx = node.ctx;

    return BlockMirrorTextToBlocks.create_block('ast_Starred', node.lineno, {}, {
        "VALUE": this.convert(value, node)
    }, {
        "inline": true
    });
}


// ast_Str
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_Str",
    "message0": "%1",
    "args0": [
        { "type": "field_input", "name": "TEXT", "value": '__' }
    ],
    "output": "String",
    "colour": BlockMirrorTextToBlocks.COLOR.TEXT,
    "extensions": ["text_quotes"]
});

BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_StrChar",
    "message0": "%1",
    "args0": [
        {
            "type": "field_dropdown", "name": "TEXT", "options": [
                ["\\n", "\n"], ["\\t", "\t"]
            ]
        }
    ],
    "output": "String",
    "colour": BlockMirrorTextToBlocks.COLOR.TEXT,
    "extensions": ["text_quotes"]
});

BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_StrMultiline",
    "message0": "%1",
    "args0": [
        { "type": "field_multilinetext", "name": "TEXT", "value": '__' }
    ],
    "output": "String",
    "colour": BlockMirrorTextToBlocks.COLOR.TEXT,
    "extensions": ["text_quotes"]
});

BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_StrDocstring",
    "message0": "Docstring: %1 %2",
    "args0": [
        { "type": "input_dummy" },
        { "type": "field_multilinetext", "name": "TEXT", "value": '__' }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": BlockMirrorTextToBlocks.COLOR.TEXT
});

/*
"https://game-icons.net/icons/ffffff/000000/1x1/delapouite/labrador-head.png"
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_StrImage",
    "message0": "%1%2",
    "args0": [
        {"type": "field_image", "src": "https://game-icons.net/icons/ffffff/000000/1x1/delapouite/labrador-head.png", "width": 20, "height": 20, "alt": ""},
        //{"type": "field_label_serializable", "name": "SRC", "value": '__', "visible": "false"}
    ],
    "output": "String",
    "colour": BlockMirrorTextToBlocks.COLOR.TEXT,
    //"extensions": ["text_quotes"]
});*/

BlockMirrorTextToBlocks.prototype.isSingleChar = function (text) {
    return text === "\n" || text === "\t";
};

BlockMirrorTextToBlocks.prototype.isDocString = function (node, parent) {
    return (parent._astname === 'Expr' &&
        parent._parent &&
        ['FunctionDef', 'ClassDef'].indexOf(parent._parent._astname) !== -1 &&
        parent._parent.body[0] === parent);
};

BlockMirrorTextToBlocks.prototype.isSimpleString = function (text) {
    return text.split("\n").length <= 2 && text.length <= 40;
};

BlockMirrorTextToBlocks.prototype.dedent = function (text, levels, isDocString) {
    if (!isDocString && text.charAt(0) === "\n") {
        return text;
    }
    let split = text.split("\n");
    let indentation = "    ".repeat(levels);
    let recombined = [];
    // Are all lines indented?
    for (let i = 0; i < split.length; i++) {
        // This was a blank line, add it unchanged unless its the first line
        if (split[i] === '__') {
            if (i !== 0) {
                recombined.push("");
            }
            // If it has our ideal indentation, add it without indentation
        } else if (split[i].startsWith(indentation)) {
            let unindentedLine = split[i].substr(indentation.length);
            if (unindentedLine !== '__' || i !== split.length - 1) {
                recombined.push(unindentedLine);
            }
            // If it's the first line, then add it unmodified
        } else if (i === 0) {
            recombined.push(split[i]);
            // This whole structure cannot be uniformly dedented, better give up.
        } else {
            return text;
        }
    }
    return recombined.join("\n");
};

// TODO: Handle indentation intelligently
BlockMirrorTextToBlocks.prototype['ast_Str'] = function (node, parent) {
    let s = node.s;
    let text = Sk.ffi.remapToJs(s);
    const regex = REGEX_PATTERNS["string"];
    //console.log(text, regex.test(JSON.stringify(text)));
    if (regex.test(JSON.stringify(text))) {
        //if (text.startsWith("http") && text.endsWith(".png")) {
        return BlockMirrorTextToBlocks.create_block("ast_Image", node.lineno, {}, {}, {},
            { "@src": text });
    } else if (this.isSingleChar(text)) {
        return BlockMirrorTextToBlocks.create_block("ast_StrChar", node.lineno, { "TEXT": text });
    } else if (this.isDocString(node, parent)) {
        let dedented = this.dedent(text, this.levelIndex - 1, true);
        return [BlockMirrorTextToBlocks.create_block("ast_StrDocstring", node.lineno, { "TEXT": dedented })];
    } else if (text.indexOf('\n') === -1) {
        return BlockMirrorTextToBlocks.create_block("ast_Str", node.lineno, { "TEXT": text });
    } else {
        let dedented = this.dedent(text, this.levelIndex - 1, false);
        return BlockMirrorTextToBlocks.create_block("ast_StrMultiline", node.lineno, { "TEXT": dedented });
    }
};

var isWeirdSliceCase = function (slice) {
    return (slice.lower == null && slice.upper == null &&
        slice.step !== null && slice.step._astname === 'NameConstant' &&
        slice.step.value === Sk.builtin.none.none$);
}

BlockMirrorTextToBlocks.prototype.addSliceDim = function (slice, i, values, mutations, node) {
    let sliceKind = slice._astname;
    if (sliceKind === "Index") {
        values['INDEX' + i] = this.convert(slice.value, node);
        mutations.push("I");
    } else if (sliceKind === "Slice") {
        let L = "0", U = "0", S = "0";
        if (slice.lower !== null) {
            values['SLICELOWER' + i] = this.convert(slice.lower, node);
            L = "1";
        }
        if (slice.upper !== null) {
            values['SLICEUPPER' + i] = this.convert(slice.upper, node);
            U = "1";
        }
        if (slice.step !== null && !isWeirdSliceCase(slice)) {
            values['SLICESTEP' + i] = this.convert(slice.step, node);
            S = "1";
        }
        mutations.push("S" + L + U + S);
    }
}

BlockMirrorTextToBlocks.prototype['ast_Subscript'] = function (node, parent) {
    let value = node.value;
    let slice = node.slice;
    let ctx = node.ctx;

    let values = { 'VALUE': this.convert(value, node) };
    let mutations = [];

    let sliceKind = slice._astname;
    if (sliceKind === "ExtSlice") {
        for (let i = 0; i < slice.dims.length; i += 1) {
            let dim = slice.dims[i];
            this.addSliceDim(dim, i, values, mutations, node);
        }
    } else {
        this.addSliceDim(slice, 0, values, mutations, node);
    }
    return BlockMirrorTextToBlocks.create_block("ast_Subscript", node.lineno, {},
        values, { "inline": "true" }, { "arg": mutations });
};


// ast_Try
BlockMirrorTextToBlocks.HANDLERS_CATCH_ALL = 0;
BlockMirrorTextToBlocks.HANDLERS_NO_AS = 1;
BlockMirrorTextToBlocks.HANDLERS_COMPLETE = 3;

BlockMirrorTextToBlocks.prototype['ast_Try'] = function (node, parent) {
    let body = node.body;
    let handlers = node.handlers;
    let orelse = node.orelse;
    let finalbody = node.finalbody;

    let fields = {};
    let values = {};
    let mutations = {
        "@ORELSE": orelse !== null && orelse.length > 0,
        "@FINALBODY": finalbody !== null && finalbody.length > 0,
        "@HANDLERS": handlers.length
    };

    let statements = { "BODY": this.convertBody(body, node) };
    if (orelse !== null) {
        statements['ORELSE'] = this.convertBody(orelse, node);
    }
    if (finalbody !== null && finalbody.length) {
        statements['FINALBODY'] = this.convertBody(finalbody, node);
    }

    let handledLevels = [];
    for (let i = 0; i < handlers.length; i++) {
        let handler = handlers[i];
        statements["HANDLER" + i] = this.convertBody(handler.body, node);
        if (handler.type === null) {
            handledLevels.push(BlockMirrorTextToBlocks.HANDLERS_CATCH_ALL);
        } else {
            values["TYPE" + i] = this.convert(handler.type, node);
            if (handler.name === null) {
                handledLevels.push(BlockMirrorTextToBlocks.HANDLERS_NO_AS);
            } else {
                handledLevels.push(BlockMirrorTextToBlocks.HANDLERS_COMPLETE);
                fields["NAME" + i] = Sk.ffi.remapToJs(handler.name.id);
            }
        }
    }

    mutations["ARG"] = handledLevels;

    return BlockMirrorTextToBlocks.create_block("ast_Try", node.lineno, fields,
        values, {}, mutations, statements);
};

BlockMirrorTextToBlocks.prototype['ast_Tuple'] = function (node, parent) {
    var elts = node.elts;
    var ctx = node.ctx;

    return BlockMirrorTextToBlocks.create_block("ast_Tuple", node.lineno, {},
        this.convertElements("ADD", elts, node),
        {
            "inline": elts.length > 4 ? "false" : "true",
        }, {
        "@items": elts.length
    });
}


// ast_UnaryOp
BlockMirrorTextToBlocks.UNARYOPS = [
    ["+", "UAdd", 'Do nothing to the number'],
    ["-", "USub", 'Make the number negative'],
    ["not", "Not", 'Return the logical opposite of the value.'],
    ["~", "Invert", 'Take the bit inversion of the number']
];

BlockMirrorTextToBlocks.UNARYOPS.forEach(function (unaryop) {
    //Blockly.Constants.Math.TOOLTIPS_BY_OP[unaryop[1]] = unaryop[2];

    let fullName = "ast_UnaryOp" + unaryop[1];

    BlockMirrorTextToBlocks.BLOCKS.push({
        "type": fullName,
        "message0": unaryop[0] + " %1",
        "args0": [
            { "type": "input_value", "name": "VALUE" }
        ],
        "inputsInline": false,
        "output": null,
        "colour": (unaryop[1] === 'Not' ?
            BlockMirrorTextToBlocks.COLOR.LOGIC :
            BlockMirrorTextToBlocks.COLOR.MATH)
    });
});

BlockMirrorTextToBlocks.prototype['ast_UnaryOp'] = function (node, parent) {
    let op = node.op.name;
    let operand = node.operand;

    return BlockMirrorTextToBlocks.create_block('ast_UnaryOp' + op, node.lineno, {}, {
        "VALUE": this.convert(operand, node)
    }, {
        "inline": false
    });
}



BlockMirrorTextToBlocks.prototype['ast_While'] = function (node, parent) {
    let test = node.test;
    let body = node.body;
    let orelse = node.orelse;

    let values = { "TEST": this.convert(test, node) };
    let statements = { "BODY": this.convertBody(body, node) };

    let hasOrelse = false;
    if (orelse !== null && orelse.length > 0) {
        statements['ORELSEBODY'] = this.convertBody(orelse, node);
        hasOrelse = true;
    }

    return BlockMirrorTextToBlocks.create_block("ast_While", node.lineno, {},
        values, {}, {
        "@orelse": hasOrelse
    }, statements);
};


// ast_With
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_WithItem",
    "output": "WithItem",
    "message0": "context %1",
    "args0": [{ "type": "input_value", "name": "CONTEXT" }],
    "enableContextMenu": false,
    "colour": BlockMirrorTextToBlocks.COLOR.CONTROL,
    "inputsInline": false,
});

BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_WithItemAs",
    "output": "WithItem",
    "message0": "context %1 as %2",
    "args0": [{ "type": "input_value", "name": "CONTEXT" },
    { "type": "input_value", "name": "AS" }],
    "enableContextMenu": false,
    "colour": BlockMirrorTextToBlocks.COLOR.CONTROL,
    "inputsInline": true,
});

BlockMirrorTextToBlocks.prototype['ast_With'] = function (node, parent) {
    let items = node.items;
    let body = node.body;

    let values = {};
    let mutations = { "@items": items.length };

    let renamedItems = [];
    for (let i = 0; i < items.length; i++) {
        let hasRename = items[i].optional_vars;
        renamedItems.push(hasRename);
        let innerValues = { 'CONTEXT': this.convert(items[i].context_expr, node) };
        if (hasRename) {
            innerValues['AS'] = this.convert(items[i].optional_vars, node);
            values['ITEM' + i] = BlockMirrorTextToBlocks.create_block("ast_WithItemAs", node.lineno,
                {}, innerValues, this.LOCKED_BLOCK);
        } else {
            values['ITEM' + i] = BlockMirrorTextToBlocks.create_block("ast_WithItem", node.lineno,
                {}, innerValues, this.LOCKED_BLOCK);
        }
    }
    mutations['as'] = renamedItems;

    return BlockMirrorTextToBlocks.create_block("ast_With", node.lineno, {},
        values,
        {
            "inline": "false"
        }, mutations, {
        'BODY': this.convertBody(body, node)
    });
};


// ast_Yield
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_YieldFull",
    "message0": "yield %1",
    "args0": [
        { "type": "input_value", "name": "VALUE" }
    ],
    "inputsInline": false,
    "output": null,
    "colour": BlockMirrorTextToBlocks.COLOR.FUNCTIONS,
});

BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_Yield",
    "message0": "yield",
    "inputsInline": false,
    "output": null,
    "colour": BlockMirrorTextToBlocks.COLOR.FUNCTIONS,
});

BlockMirrorTextToBlocks.prototype['ast_Yield'] = function (node, parent) {
    let value = node.value;

    if (value == null) {
        return BlockMirrorTextToBlocks.create_block("ast_Yield", node.lineno);
    } else {
        return BlockMirrorTextToBlocks.create_block("ast_YieldFull", node.lineno, {}, {
            "VALUE": this.convert(value, node)
        });
    }
};


// ast_YieldFrom
BlockMirrorTextToBlocks.BLOCKS.push({
    "type": "ast_YieldFrom",
    "message0": "yield from %1",
    "args0": [
        { "type": "input_value", "name": "VALUE" }
    ],
    "inputsInline": false,
    "output": null,
    "colour": BlockMirrorTextToBlocks.COLOR.FUNCTIONS,
});

BlockMirrorTextToBlocks.prototype['ast_YieldFrom'] = function (node, parent) {
    let value = node.value;

    return BlockMirrorTextToBlocks.create_block("ast_YieldFrom", node.lineno, {}, {
        "VALUE": this.convert(value, node)
    });
};

var ZERO_BLOCK = BlockMirrorTextToBlocks.create_block('ast_Num', null, {
    'NUM': 0
});