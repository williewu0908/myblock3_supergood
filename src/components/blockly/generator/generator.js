import * as Blockly from 'blockly/core';
import { pythonGenerator, Order } from 'blockly/python';
import { BlockMirrorTextToBlocks } from '../blocks/text_to_blocks'



Blockly.Names.prototype.getName = function (nameOrId, type) {
  // 确保 variableMap 和 type 是正确的
  if (type === Blockly.VARIABLE_CATEGORY_NAME && this.variableMap) {
    const variable = this.variableMap.getVariableById(nameOrId);
    if (variable) {
      nameOrId = variable.name;
    }
  }

  // 确保 nameOrId 和 type 是有效字符串
  if (typeof nameOrId !== 'string' || nameOrId.length === 0) {
    throw new Error("Invalid nameOrId: must be a non-empty string.");
  }
  if (typeof type !== 'string' || type.length === 0) {
    throw new Error("Invalid type: must be a non-empty string.");
  }

  // 规范化名称
  var normalized = nameOrId + '_' + type;
  var isVarType = type === Blockly.VARIABLE_CATEGORY_NAME || 
                  type === Blockly.Names.DEVELOPER_VARIABLE_TYPE;
  var prefix = isVarType ? this.variablePrefix : '';

  // 如果名称已存在，直接返回
  if (this.db && normalized in this.db) {
    return prefix + this.db[normalized];
  }

  // 否则生成唯一的名称
  var safeName = this.getDistinctName(nameOrId, type);
  if (!this.db) {
    this.db = {};  // 确保 db 已初始化
  }
  this.db[normalized] = safeName.substring(prefix.length);
  
  return safeName;
};




Blockly.Variables.nameUsedWithOtherType_ = function (name, type, workspace) {
  var allVariables = workspace.getVariableMap().getAllVariables();

  for (var i = 0, variable; variable = allVariables[i]; i++) {
    if (variable.name == name && variable.type != type) {
      return variable;
    }
  }

  return null;
};

Blockly.Variables.nameUsedWithAnyType_ = function (name, workspace) {
  var allVariables = workspace.getVariableMap().getAllVariables();

  for (var i = 0, variable; variable = allVariables[i]; i++) {
    if (variable.name == name) {
      return variable;
    }
  }

  return null;
};

var BINOPS_BLOCKLY_GENERATE = {};
BlockMirrorTextToBlocks.BINOPS_AUGASSIGN_PREPOSITION = {};
BlockMirrorTextToBlocks.BINOPS.forEach(function (binop) {
  BINOPS_BLOCKLY_GENERATE[binop[1]] = [" " + binop[0], binop[2]];
  BlockMirrorTextToBlocks.BINOPS_AUGASSIGN_PREPOSITION[binop[1]] = binop[5];
  //Blockly.Constants.Math.TOOLTIPS_BY_OP[binop[1]] = binop[3];
});

pythonGenerator.forBlock['blank'] = '___';

pythonGenerator.forBlock['ast_AnnAssignFull'] = function (block, generator) {
  // Create a list with any number of elements of any type.
  let target = generator.valueToCode(block, 'TARGET',
    Order.NONE) || '__';
  let annotation = generator.valueToCode(block, 'ANNOTATION',
    Order.NONE) || '__';
  let value = "";
  if (this.initialized_) {
    value = " = " + generator.valueToCode(block, 'VALUE',
      Order.NONE) || '__';
  }
  return target + ": " + annotation + value + "\n";
};

pythonGenerator.forBlock['ast_AnnAssign'] = function (block, generator) {
  // Create a list with any number of elements of any type.
  var target = generator.getVariableName(block.getFieldValue('TARGET'));
  let annotation = block.getFieldValue('ANNOTATION');
  if (block.strAnnotations_) {
    annotation = pythonGenerator.quote_(annotation);
  }
  let value = "";
  if (this.initialized_) {
    value = " = " + generator.valueToCode(block, 'VALUE',
      Order.NONE) || '__';
  }
  return target + ": " + annotation + value + "\n";
};

pythonGenerator.forBlock['ast_Assert'] = function (block, generator) {
  var test = generator.valueToCode(block, 'TEST', Order.ATOMIC) || '__';
  return "assert " + test + "\n";
};

pythonGenerator.forBlock['ast_AssertFull'] = function (block, generator) {
  var test = generator.valueToCode(block, 'TEST', Order.ATOMIC) || '__';
  var msg = generator.valueToCode(block, 'MSG', Order.ATOMIC) || '__';
  return "assert " + test + ", " + msg + "\n";
};

pythonGenerator.forBlock['ast_Assign'] = function (block, generator) {
  // Create a list with any number of elements of any type.
  let value = generator.valueToCode(block, 'VALUE',
    Order.NONE) || '__';
  let targets = new Array(block.targetCount_);
  if (block.targetCount_ === 1 && block.simpleTarget_) {
    targets[0] = generator.getVariableName(block.getFieldValue('VAR'));
  } else {
    for (var i = 0; i < block.targetCount_; i++) {
      targets[i] = (generator.valueToCode(block, 'TARGET' + i,
        Order.NONE) || '__');
    }
  }
  return targets.join(' = ') + " = " + value + "\n";
};

pythonGenerator.forBlock['ast_Attribute'] = function (block, generator) {
  // Text value.
  var value = generator.getVariableName(block.getFieldValue('VALUE'));
  var attr = block.getFieldValue('ATTR');
  let code = value + "." + attr;
  return [code, Order.MEMBER];
};

pythonGenerator.forBlock['ast_AttributeFull'] = function (block, generator) {
  // Text value.
  var value = generator.valueToCode(block, 'VALUE', Order.NONE) || '__';
  var attr = block.getFieldValue('ATTR');
  let code = value + "." + attr;
  return [code, Order.MEMBER];
};

pythonGenerator.forBlock['ast_AugAssign'] = function (block, generator) {
  // Create a list with any number of elements of any type.
  let target;
  if (block.simpleTarget_) {
    target = generator.getVariableName(block.getFieldValue('VAR'));
  } else {
    target = generator.valueToCode(block, 'TARGET',
      Order.NONE) || '__';
  }

  let operator = BINOPS_BLOCKLY_GENERATE[block.getFieldValue('OP_NAME')][0];

  let value = generator.valueToCode(block, 'VALUE',
    Order.NONE) || '__';
  return target + operator + "= " + value + "\n";
};

pythonGenerator.forBlock['ast_BinOp'] = function (block, generator) {
  // Basic arithmetic operators, and power.
  var tuple = BINOPS_BLOCKLY_GENERATE[block.getFieldValue('OP')];
  var operator = tuple[0] + " ";
  var order = tuple[1];
  var argument0 = generator.valueToCode(block, 'A', order) || '__';
  var argument1 = generator.valueToCode(block, 'B', order) || '__';
  var code = argument0 + operator + argument1;
  return [code, order];
};

pythonGenerator.forBlock['ast_BinOpFull'] = pythonGenerator.forBlock['ast_BinOp'];

pythonGenerator.forBlock['ast_BoolOp'] = function (block, generator) {
  // Operations 'and', 'or'.
  var operator = (block.getFieldValue('OP') === 'And') ? 'and' : 'or';
  var order = (operator === 'and') ? Order.LOGICAL_AND :
    Order.LOGICAL_OR;
  var argument0 = generator.valueToCode(block, 'A', order) || '__';
  var argument1 = generator.valueToCode(block, 'B', order) || '__';
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

pythonGenerator.forBlock['ast_Break'] = function (block) {
  return "break\n";
};

pythonGenerator.forBlock['ast_Call'] = function (block, generator) {
  // Handle import if there is a module
  if (block.module_) {
    generator.definitions_["import_" + block.module_] = BlockMirrorTextToBlocks.prototype.MODULE_FUNCTION_IMPORTS[block.module_];
  }

  // 获取调用者名称
  let funcName = "";
  if (block.isMethod_) {
     funcName = generator.valueToCode(block, 'FUNC', Order.FUNCTION_CALL) || generator.valueToCode(block, 'FUNCTION_NAME', Order.FUNCTION_CALL) || '__';
  }

  // 获取用户自定义的函数名称
  funcName += block.getFieldValue('FUNCTION_NAME') || "__";  // 修改这里使用 getFieldValue
  
  // 构建参数列表
  let args = [];
  for (let i = 0; i < block.arguments_.length; i++) {
    let value = generator.valueToCode(block, 'ARG' + i, Order.NONE) || '__';
    let argument = block.arguments_[i];

    if (argument.startsWith('KWARGS:')) {
      args[i] = "**" + value;
    } else if (argument.startsWith('KEYWORD:')) {
      args[i] = argument.substring(8) + "=" + value;
    } else {
      args[i] = value;
    }
  }

  // 生成最终的代码
  let code = funcName + '(' + args.join(', ') + ')';
  if (block.returns_) {
    return [code, Order.FUNCTION_CALL];
  } else {
    return code + "\n";
  }
};



pythonGenerator.forBlock['ast_ClassDef'] = function (block, generator) {
  // Name
  let name = generator.getVariableName(block.getFieldValue('NAME'));
  // Decorators
  let decorators = new Array(block.decorators_);
  for (let i = 0; i < block.decorators_; i++) {
    let decorator = (pythonGenerator.valueToCode(block, 'DECORATOR' + i, Order.NONE) ||
      '__');
    decorators[i] = "@" + decorator + "\n";
  }
  // Bases
  let bases = new Array(block.bases_);
  for (let i = 0; i < block.bases_; i++) {
    bases[i] = (generator.valueToCode(block, 'BASE' + i, Order.NONE) ||
      '__');
  }
  // Keywords
  let keywords = new Array(block.keywords_);
  for (let i = 0; i < block.keywords_; i++) {
    let name = block.getFieldValue('KEYWORDNAME' + i);
    let value = (generator.valueToCode(block, 'KEYWORDVALUE' + i, Order.NONE) ||
      '__');
    if (name == '**') {
      keywords[i] = '**' + value;
    } else {
      keywords[i] = name + '=' + value;
    }
  }
  // Body:
  let body = generator.statementToCode(block, 'BODY') || pythonGenerator.PASS;
  // Put it together
  let args = (bases.concat(keywords));
  args = (args.length === 0) ? "" : "(" + args.join(', ') + ")";
  return decorators.join('__') + "class " + name + args + ":\n" + body;
};


pythonGenerator.forBlock['ast_Comment'] = function (block) {
  var text_body = block.getFieldValue('BODY');
  return '#' + text_body + '\n';
};


['ListComp', 'SetComp', 'GeneratorExp', 'DictComp'].forEach(function (kind) {
  pythonGenerator.forBlock['ast_' + kind] = function (block, generator) {
    // elt
    let elt;
    if (kind === 'DictComp') {
      let child = block.getInputTargetBlock('ELT');
      if (child === null || child.type !== 'ast_DictItem') {
        elt = ('__' + ": " + '__');
      } else {
        let key = generator.valueToCode(child, 'KEY', Order.NONE) ||
          '__';
        let value = generator.valueToCode(child, 'VALUE', Order.NONE) ||
          '__';
        elt = (key + ": " + value);
      }
    } else {
      elt = generator.valueToCode(block, 'ELT', Order.NONE) ||
        '__';
    }
    // generators
    let elements = new Array(block.itemCount_);
    const BAD_DEFAULT = (elt + " for " + '__' + " in" + '__');
    for (var i = 0; i < block.itemCount_; i++) {
      let child = block.getInputTargetBlock('GENERATOR' + i);
      if (child === null) {
        elements[i] = BAD_DEFAULT;
      } else if (child.type === 'ast_comprehensionIf') {
        let test = generator.valueToCode(child, 'TEST', Order.NONE) ||
          '__';
        elements[i] = ("if " + test);
      } else if (child.type === 'ast_comprehensionFor') {
        let target = generator.valueToCode(child, 'TARGET', Order.NONE) ||
          '__';
        let iter = generator.valueToCode(child, 'ITER', Order.NONE) ||
          '__';
        elements[i] = ("for " + target + " in " + iter);
      } else {
        elements[i] = BAD_DEFAULT;
      }
    }
    // Put it all together
    let code = BlockMirrorTextToBlocks.COMP_SETTINGS[kind].start
      + elt + " " + elements.join(' ') +
      BlockMirrorTextToBlocks.COMP_SETTINGS[kind].end;
    return [code, Order.ATOMIC];
  };
});


var COMPARES_BLOCKLY_GENERATE = {};
BlockMirrorTextToBlocks.COMPARES.forEach(function (boolop) {
  COMPARES_BLOCKLY_GENERATE[boolop[1]] = boolop[0];
});
pythonGenerator.forBlock['ast_Compare'] = function (block, generator) {
  // Basic arithmetic operators, and power.
  var tuple = COMPARES_BLOCKLY_GENERATE[block.getFieldValue('OP')];
  var operator = ' ' + tuple + ' ';
  var order = Order.RELATIONAL;
  var argument0 = generator.valueToCode(block, 'A', order) || '__';
  var argument1 = generator.valueToCode(block, 'B', order) || '__';
  var code = argument0 + operator + argument1;
  return [code, order];
};

pythonGenerator.forBlock['ast_Continue'] = function (block) {
  return "continue\n";
};

pythonGenerator.forBlock['ast_Delete'] = function (block, generator) {
  // Create a list with any number of elements of any type.
  var elements = new Array(block.targetCount_);
  for (var i = 0; i < block.targetCount_; i++) {
    elements[i] = generator.valueToCode(block, 'TARGET' + i,
      Order.NONE) || '__';
  }
  var code = 'del ' + elements.join(', ') + "\n";
  return code;
};

pythonGenerator.forBlock['ast_Dict'] = function (block, generator) {
  // Create a dict with any number of elements of any type.
  var elements = new Array(block.itemCount_);
  for (var i = 0; i < block.itemCount_; i++) {
    let child = block.getInputTargetBlock('ADD' + i);
    if (child === null || child.type != 'ast_DictItem') {
      elements[i] = ('__' + ": " + '__');
      continue;
    }
    let key = generator.valueToCode(child, 'KEY', Order.NONE) ||
      '__';
    let value = generator.valueToCode(child, 'VALUE', Order.NONE) ||
      '__';
    elements[i] = (key + ": " + value);
  }
  var code = '{' + elements.join(', ') + '}';
  return [code, Order.ATOMIC];
};

pythonGenerator.forBlock['ast_Expr'] = function (block, generator) {
  // Numeric value.
  var value = generator.valueToCode(block, 'VALUE', Order.ATOMIC) || '__';
  // TODO: Assemble JavaScript into code variable.
  return value + "\n";
};

pythonGenerator.forBlock['ast_For'] = function (block, generator) {
  // For each loop.
  var argument0 = generator.valueToCode(block, 'TARGET',
    Order.RELATIONAL) || '__';
  var argument1 = generator.valueToCode(block, 'ITER',
    Order.RELATIONAL) || '__';
  var branchBody = generator.statementToCode(block, 'BODY') || pythonGenerator.PASS;
  var branchElse = generator.statementToCode(block, 'ELSE');
  var code = 'for ' + argument0 + ' in ' + argument1 + ':\n' + branchBody;
  if (branchElse) {
    code += 'else:\n' + branchElse;
  }
  return code;
};

pythonGenerator.forBlock['ast_ForElse'] = pythonGenerator.forBlock['ast_For'];

[
  ['Parameter', 'Parameter', '', false, false], 
  ['ParameterType', 'Parameter with type', '', true, false], 
  ['ParameterDefault', 'Parameter with default value', '', false, true], 
  ['ParameterDefaultType', 'Parameter with type and default value', '', true, true], 
  ['ParameterVararg', 'Variable length parameter', '*', false, false], 
  ['ParameterVarargType', 'Variable length parameter with type', '*', true, false], 
  ['ParameterKwarg', 'Keyworded Variable length parameter', '**', false], 
  ['ParameterKwargType', 'Keyworded Variable length parameter with type', '**', true, false]
].forEach(function (parameterTypeTuple) {
  let parameterType = parameterTypeTuple[0],
    parameterDescription = parameterTypeTuple[1],
    parameterPrefix = parameterTypeTuple[2],
    parameterTyped = parameterTypeTuple[3],
    parameterDefault = parameterTypeTuple[4];
  
  pythonGenerator.forBlock["ast_Function" + parameterType] = function (block, generator) {
    // 取得參數名稱
    let name = generator.getVariableName(block.getFieldValue('NAME'));
    
    // 處理參數類型
    let typed = "";
    if (parameterTyped) {
      typed = ": " + (generator.valueToCode(block, 'TYPE', Order.NONE) || '__');
    }
    
    // 處理參數預設值
    let defaulted = "";
    if (parameterDefault) {
      defaulted = "=" + (generator.valueToCode(block, 'DEFAULT', Order.NONE) || '__');
    }

    // 返回完整參數的字符串
    return [parameterPrefix + name + typed + defaulted, Order.ATOMIC];
  };
});

// 修改 ast_FunctionDef 生成器代碼
pythonGenerator.forBlock['ast_FunctionDef'] = function (block, generator) {
  // 獲取函數名稱
  let name = generator.getVariableName(block.getFieldValue('NAME'));
  console.log(block.decoratorsCount_)
  // 處理 Decorators
  let decorators = [];
  for (let i = 0; i < block.decoratorsCount_; i++) {
    let decorator = generator.valueToCode(block, 'DECORATOR' + i, Order.NONE) || '__';
    decorators.push("@" + decorator);
  }

  // 處理函數參數
  let parameters = [];
  for (let i = 0; i < block.parametersCount_; i++) {
    let parameter = generator.valueToCode(block, 'PARAMETER' + i, Order.NONE) || '';
    parameters.push(parameter);
  }

  // 檢查參數數量，防止未拼接到的情況
  if (parameters.length === 0) {
    parameters.push('__');  // 如果無參數，提供一個默認值
  }

  // 處理返回值註解
  let returns = "";
  if (block.hasReturn_) {
    returns = " -> " + (generator.valueToCode(block, 'RETURNS', Order.NONE) || '__');
  }

  // 處理函數體
  let body = generator.statementToCode(block, 'BODY') || pythonGenerator.PASS;

  // 組合並返回最終的 Python 代碼
  return decorators.join('\n') + "\ndef " + name + "(" + parameters.join(', ') + ")" + returns + ":\n" + body;
};



pythonGenerator.forBlock['ast_Global'] = function (block, generator) {
  // Create a list with any number of elements of any type.
  let elements = new Array(block.nameCount_);
  for (let i = 0; i < block.nameCount_; i++) {
    elements[i] = generator.getVariableName(block.getFieldValue('NAME' + i));
  }
  return 'global ' + elements.join(', ') + "\n";
};

pythonGenerator.forBlock['ast_If'] = function (block, generator) {
  // Test
  let test = "if " + (generator.valueToCode(block, 'TEST',
    Order.NONE) || '__') + ":\n";
  // Body:
  let body = generator.statementToCode(block, 'BODY') || pythonGenerator.PASS;
  // Elifs
  let elifs = new Array(block.elifs_);
  for (let i = 0; i < block.elifs_; i++) {
    let elif = block.elifs_[i];
    let clause = "elif " + (generator.valueToCode(block, 'ELIFTEST' + i,
      Order.NONE) || '__');
    clause += ":\n" + (generator.statementToCode(block, 'ELIFBODY' + i) || pythonGenerator.PASS);
    elifs[i] = clause;
  }
  // Orelse:
  let orelse = "";
  if (this.orelse_) {
    orelse = "else:\n" + (generator.statementToCode(block, 'ORELSEBODY') || pythonGenerator.PASS);
  }
  return test + body + elifs.join("") + orelse;
};

pythonGenerator.forBlock['ast_IfExp'] = function (block, generator) {
  var test = generator.valueToCode(block, 'TEST', Order.CONDITIONAL) || '__';
  var body = generator.valueToCode(block, 'BODY', Order.CONDITIONAL) || '__';
  var orelse = generator.valueToCode(block, 'ORELSE', Order.CONDITIONAL) || '__';
  return [body + " if " + test + " else " + orelse + "\n", Order.CONDITIONAL];
};

pythonGenerator.forBlock['ast_Import'] = function (block, generator) {
  // Optional from part
  let from = "";
  if (this.from_) {
    let moduleName = block.getFieldValue('MODULE');
    from = "from " + moduleName + " ";
    generator.imported_["import_" + moduleName] = moduleName;
  }
  // Create a list with any number of elements of any type.
  let elements = new Array(block.nameCount_);
  for (let i = 0; i < block.nameCount_; i++) {
    let name = block.getFieldValue('NAME' + i);
    elements[i] = name;
    if (!this.regulars_[i]) {
      name = generator.getVariableName(block.getFieldValue('ASNAME' + i));
      elements[i] += " as " + name;
    }
    if (!from) {
      generator.imported_["import_" + name] = name;
    }
  }
  return from + 'import ' + elements.join(', ') + "\n";
};

pythonGenerator.forBlock['ast_Lambda'] = function (block, generator) {
  // Parameters
  let parameters = new Array(block.parametersCount_);
  for (let i = 0; i < block.parametersCount_; i++) {
    parameters[i] = (generator.valueToCode(block, 'PARAMETER' + i, Order.NONE) || '__');
  }
  // Body
  let body = generator.valueToCode(block, 'BODY', Order.LAMBDA) || pythonGenerator.PASS;
  return ["lambda " + parameters.join(', ') + ": " + body, Order.LAMBDA];
};

pythonGenerator.forBlock['ast_List'] = function (block, generator) {
  // Create a list with any number of elements of any type.
  var elements = new Array(block.itemCount_);
  for (var i = 0; i < block.itemCount_; i++) {
    elements[i] = generator.valueToCode(block, 'ADD' + i,
      Order.NONE) || '__';
  }
  var code = '[' + elements.join(', ') + ']';
  return [code, Order.ATOMIC];
};

pythonGenerator.forBlock['ast_Name'] = function (block, generator) {
  // Variable getter.
  var code = generator.getVariableName(block.getFieldValue('VAR'));
  return [code, Order.ATOMIC];
};

pythonGenerator.forBlock['ast_NameConstantBoolean'] = function (block) {
  // Boolean values true and false.
  var code = (block.getFieldValue('BOOL') == 'TRUE') ? 'True' : 'False';
  return [code, Order.ATOMIC];
};

pythonGenerator.forBlock['ast_NameConstantNone'] = function (block) {
  // Boolean values true and false.
  var code = 'None';
  return [code, Order.ATOMIC];
};

pythonGenerator.forBlock['ast_Nonlocal'] = function (block, generator) {
  // Create a list with any number of elements of any type.
  let elements = new Array(block.nameCount_);
  for (let i = 0; i < block.nameCount_; i++) {
    elements[i] = generator.getVariableName(block.getFieldValue('NAME' + i));
  }
  return 'nonlocal ' + elements.join(', ') + "\n";
};

pythonGenerator.forBlock['ast_Num'] = function (block) {
  // Numeric value.
  var code = parseFloat(block.getFieldValue('NUM'));
  var order;
  if (code == Infinity) {
    code = 'float("inf")';
    order = Order.FUNCTION_CALL;
  } else if (code == -Infinity) {
    code = '-float("inf")';
    order = Order.UNARY_SIGN;
  } else {
    order = code < 0 ? Order.UNARY_SIGN :
      Order.ATOMIC;
  }
  return [code, order];
};

pythonGenerator.forBlock['ast_Raise'] = function (block, generator) {
  if (this.exc_) {
    let exc = generator.valueToCode(block, 'EXC', Order.NONE) || '__';
    if (this.cause_) {
      let cause = generator.valueToCode(block, 'CAUSE', Order.NONE)
        || '__';
      return "raise " + exc + " from " + cause + "\n";
    } else {
      return "raise " + exc + "\n";
    }
  } else {
    return "raise" + "\n";
  }
};

pythonGenerator.forBlock['ast_Return'] = function (block) {
  return "return\n";
};

pythonGenerator.forBlock['ast_ReturnFull'] = function (block, generator) {
  var value = generator.valueToCode(block, 'VALUE', Order.ATOMIC) || '__';
  return "return " + value + "\n";
};

pythonGenerator.forBlock['ast_Set'] = function (block, generator) {
  // Create a set with any number of elements of any type.
  if (block.itemCount_ === 0) {
    return ['set()', Order.FUNCTION_CALL];
  }
  var elements = new Array(block.itemCount_);
  for (var i = 0; i < block.itemCount_; i++) {
    elements[i] = generator.valueToCode(block, 'ADD' + i,
      Order.NONE) || '__';
  }
  var code = '{' + elements.join(', ') + '}';
  return [code, Order.ATOMIC];
};

pythonGenerator.forBlock['ast_Starred'] = function (block, generator) {
  // Basic arithmetic operators, and power.
  var order = Order.NONE;
  var argument1 = generator.valueToCode(block, 'VALUE', order) || '__';
  var code = "*" + argument1;
  return [code, order];
};

pythonGenerator.forBlock['ast_Str'] = function (block, generator) {
  // Text value
  let code = pythonGenerator.quote_(block.getFieldValue('TEXT'));
  code = code.replace("\n", "n");
  return [code, Order.ATOMIC];
};

pythonGenerator.forBlock['ast_StrChar'] = function (block) {
  // Text value
  let value = block.getFieldValue('TEXT');
  switch (value) {
    case "\n": return ["'\\n'", Order.ATOMIC];
    case "\t": return ["'\\t'", Order.ATOMIC];
  }
};

pythonGenerator.forBlock['ast_Image'] = function (block) {
  // Text value
  //Blockly.Python.definitions_["import_image"] = "from image import Image";
  let code = pythonGenerator.quote_(block.src_);
  return [code, Order.FUNCTION_CALL];
};

pythonGenerator.forBlock['ast_StrMultiline'] = function (block) {
  // Text value
  let code = pythonGenerator.multiline_quote_(block.getFieldValue('TEXT'));
  return [code, Order.ATOMIC];
};

pythonGenerator.forBlock['ast_StrDocstring'] = function (block) {
  // Text value.
  let code = block.getFieldValue('TEXT');
  if (code.charAt(0) !== '\n') {
    code = '\n' + code;
  }
  if (code.charAt(code.length - 1) !== '\n') {
    code = code + '\n';
  }
  return pythonGenerator.multiline_quote_(code) + "\n";
};

pythonGenerator.forBlock['ast_Subscript'] = function (block, generator) {
  // Create a list with any number of elements of any type.
  let value = generator.valueToCode(block, 'VALUE',
    Order.MEMBER) || '__';
  var slices = new Array(block.sliceKinds_.length);
  for (let i = 0; i < block.sliceKinds_.length; i++) {
    let kind = block.sliceKinds_[i];
    if (kind.charAt(0) === 'I') {
      slices[i] = generator.valueToCode(block, 'INDEX' + i,
        Order.MEMBER) || '__';
    } else {
      slices[i] = "";
      if (kind.charAt(1) === '1') {
        slices[i] += generator.valueToCode(block, 'SLICELOWER' + i,
          Order.MEMBER) || '__';
      }
      slices[i] += ":";
      if (kind.charAt(2) === '1') {
        slices[i] += generator.valueToCode(block, 'SLICEUPPER' + i,
          Order.MEMBER) || '__';
      }
      if (kind.charAt(3) === '1') {
        slices[i] += ":" + generator.valueToCode(block, 'SLICESTEP' + i,
          Order.MEMBER) || '__';
      }
    }
  }
  var code = value + '[' + slices.join(', ') + "]";
  return [code, Order.MEMBER];
};

pythonGenerator.forBlock['ast_Try'] = function (block, generator) {
  // Try:
  let body = generator.statementToCode(block, 'BODY') || pythonGenerator.PASS;
  // Except clauses
  var handlers = new Array(block.handlersCount_);
  for (let i = 0; i < block.handlersCount_; i++) {
    let level = block.handlers_[i];
    let clause = "except";
    if (level !== BlockMirrorTextToBlocks.HANDLERS_CATCH_ALL) {
      clause += " " + generator.valueToCode(block, 'TYPE' + i,
        Order.NONE) || '__';
      if (level === BlockMirrorTextToBlocks.HANDLERS_COMPLETE) {
        clause += " as " + generator.getVariableName(block.getFieldValue('NAME' + i));
      }
    }
    clause += ":\n" + (generator.statementToCode(block, 'HANDLER' + i) || pythonGenerator.PASS);
    handlers[i] = clause;
  }
  // Orelse:
  let orelse = "";
  if (this.hasElse_) {
    orelse = "else:\n" + (generator.statementToCode(block, 'ORELSE') || pythonGenerator.PASS);
  }
  // Finally:
  let finalbody = "";
  if (this.hasFinally_) {
    finalbody = "finally:\n" + (generator.statementToCode(block, 'FINALBODY') || pythonGenerator.PASS);
  }
  return "try:\n" + body + handlers.join("") + orelse + finalbody;
};

pythonGenerator.forBlock['ast_Tuple'] = function (block, generator) {
  // Create a tuple with any number of elements of any type.
  var elements = new Array(block.itemCount_);
  for (var i = 0; i < block.itemCount_; i++) {
    elements[i] = generator.valueToCode(block, 'ADD' + i,
      Order.NONE) || '__';
  }
  let requiredComma = "";
  if (block.itemCount_ == 1) {
    requiredComma = ", ";
  }
  var code = '(' + elements.join(', ') + requiredComma + ')';
  return [code, Order.ATOMIC];
};


BlockMirrorTextToBlocks.UNARYOPS = [
  ["+", "UAdd", 'Do nothing to the number'],
  ["-", "USub", 'Make the number negative'],
  ["not", "Not", 'Return the logical opposite of the value.'],
  ["~", "Invert", 'Take the bit inversion of the number']
];

BlockMirrorTextToBlocks.UNARYOPS.forEach(function (unaryop) {
  let fullName = "ast_UnaryOp" + unaryop[1];
  pythonGenerator.forBlock[fullName] = function (block, generator) {
    // Basic arithmetic operators, and power.
    var order = (unaryop[1] === 'Not' ? Order.LOGICAL_NOT : Order.UNARY_SIGN);
    var argument1 = generator.valueToCode(block, 'VALUE', order) || '__';
    var code = unaryop[0] + (unaryop[1] === 'Not' ? ' ' : '__') + argument1;
    return [code, order];
  };
});

pythonGenerator.forBlock['ast_While'] = function (block, generator) {
  // Test
  let test = "while " + (generator.valueToCode(block, 'TEST',
      Order.NONE) || '__') + ":\n";
  // Body:
  let body = generator.statementToCode(block, 'BODY') || pythonGenerator.PASS;
  // Orelse:
  let orelse = "";
  if (this.orelse_) {
      orelse = "else:\n" + (generator.statementToCode(block, 'ORELSEBODY') || pythonGenerator.PASS);
  }
  return test + body + orelse;
};

pythonGenerator.forBlock["ast_WithItem"] = function (block, generator) {
  let context = generator.valueToCode(block, 'CONTEXT',
      Order.NONE) || '__';
  return [context, Order.NONE];
};

pythonGenerator.forBlock["ast_WithItemAs"] = function (block, generator) {
  let context = generator.valueToCode(block, 'CONTEXT',
      Order.NONE) || '__';
  let as = generator.valueToCode(block, 'AS',
      Order.NONE) || '__';
  return [context + " as " + as, Order.NONE];
};

pythonGenerator.forBlock['ast_With'] = function (block, generator) {
  // Contexts
  let items = new Array(block.itemCount_);
  for (let i = 0; i < block.itemCount_; i++) {
      items[i] = (generator.valueToCode(block, 'ITEM' + i, Order.NONE) ||
          '__');
  }
  // Body
  let body = generator.statementToCode(block, 'BODY') || pythonGenerator.PASS;
  return "with " + items.join(', ') + ":\n" + body;
};

pythonGenerator.forBlock['ast_Yield'] = function (block) {
  return ["yield", Order.LAMBDA];
};

pythonGenerator.forBlock['ast_YieldFull'] = function (block, generator) {
  var value = generator.valueToCode(block, 'VALUE', Order.LAMBDA) || '__';
  return ["yield " + value, Order.LAMBDA];
};

pythonGenerator.forBlock['ast_YieldFrom'] = function (block, generator) {
  var value = generator.valueToCode(block, 'VALUE', Order.LAMBDA) || '__';
  return ["yield from " + value, Order.LAMBDA];
};

pythonGenerator.forBlock['print_call'] = function(block, generator) {
  // 生成表示参数的代码，匹配 ast_Call 的 args 部分
  var argument = generator.valueToCode(block, 'ARG0', Order.NONE) || '""';
  
  // 使用 ast_Call 的逻辑来生成 print 函数调用
  var code = 'print(' + argument + ')\n';
  return code;
};



// 生成 Python 代码的函数
function generatePythonCode(block, generator) {
  const funcName = block.type.replace('ast_', ''); // 获取函数名
  const args = [];

  // 遍历块的输入连接并获取每个参数的值
  block.inputList.forEach((input, index) => {
      if (input.connection) {
          const arg = generator.valueToCode(block, `ARG${index - 1}`, Order.FUNCTION_CALL) || 'null';
          args.push(arg);
      }
  });

  // 生成代码
  const code = `${funcName}(${args.join(', ')})`;
  return [code, Order.FUNCTION_CALL]; // 返回生成的代码和调用顺序
}

// 将生成器函数注册到 Blockly 的 Python 生成器
for (const [funcName, funcInfo] of Object.entries(BlockMirrorTextToBlocks.prototype.FUNCTION_SIGNATURES)) {
  pythonGenerator.forBlock[`ast_${funcName}`] = function(block) {
      return generatePythonCode(block, pythonGenerator);
  };
}

pythonGenerator.forBlock['ast_Raw'] = function (block) {
  var code = block.getFieldValue('TEXT') + "\n";
  return code;
};