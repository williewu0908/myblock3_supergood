import * as Blockly from 'blockly/core';

// Since we're using json to initialize the field, we'll need to import it.
import '../fields/BlocklyReactField';
import { BlockMirrorTextToBlocks } from './text_to_blocks'

// this.workspace.registerButtonCallback('createVariable', Blockly.Variables.createVariableButtonHandler(this.getTargetWorkspace(), null, 'panda'));

Blockly.Blocks['ast_Assign'] = {
  init: function () {
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BlockMirrorTextToBlocks.COLOR.VARIABLES);
    this.targetCount_ = 1;
    this.simpleTarget_ = true;
    this.updateShape_();
    Blockly.Extensions.apply("contextMenu_variableSetterGetter", this, false);
  },
  updateShape_: function () {
    if (!this.getInput('VALUE')) {
      this.appendDummyInput()
        .appendField("set");
      this.appendValueInput('VALUE')
        .appendField('=');
    }
    let i = 0;
    if (this.targetCount_ === 1 && this.simpleTarget_) {
      this.setInputsInline(true);
      if (!this.getInput('VAR_ANCHOR')) {
        this.appendDummyInput('VAR_ANCHOR')
          .appendField(new Blockly.FieldVariable("variable"), "VAR");
      }
      this.moveInputBefore('VAR_ANCHOR', 'VALUE');
    } else {
      this.setInputsInline(true);
      // Add new inputs.
      for (; i < this.targetCount_; i++) {
        if (!this.getInput('TARGET' + i)) {
          var input = this.appendValueInput('TARGET' + i);
          if (i !== 0) {
            input.appendField('and').setAlign(Blockly.inputs.Align.RIGHT);
          }
        }
        this.moveInputBefore('TARGET' + i, 'VALUE');
      }
      // Kill simple VAR
      if (this.getInput('VAR_ANCHOR')) {
        this.removeInput('VAR_ANCHOR');
      }
    }
    // Remove deleted inputs.
    while (this.getInput('TARGET' + i)) {
      this.removeInput('TARGET' + i);
      i++;
    }
  },
  /**
   * Create XML to represent list inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    var container = document.createElement('mutation');
    container.setAttribute('targets', this.targetCount_);
    container.setAttribute('simple', this.simpleTarget_);
    return container;
  },
  /**
   * Parse XML to restore the list inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.targetCount_ = parseInt(xmlElement.getAttribute('targets'), 10);
    this.simpleTarget_ = "true" === xmlElement.getAttribute('simple');
    this.updateShape_();
  },
};

Blockly.Blocks['ast_AnnAssignFull'] = {
  init: function () {
    this.appendValueInput("TARGET")
      .setCheck(null)
      .appendField("set");
    this.appendValueInput("ANNOTATION")
      .setCheck(null)
      .appendField(":");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BlockMirrorTextToBlocks.COLOR.VARIABLES);
    this.initialized_ = true;
    this.updateShape_();
  },
  /**
   * Create XML to represent list inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    let container = document.createElement('mutation');
    container.setAttribute('initialized', this.initialized_);
    return container;
  },
  /**
   * Parse XML to restore the list inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.initialized_ = "true" === xmlElement.getAttribute('initialized');
    this.updateShape_();
  },
  updateShape_: function (block) {
    // Add new inputs.
    if (this.initialized_ && !this.getInput('VALUE')) {
      this.appendValueInput('VALUE')
        .appendField('=')
        .setAlign(Blockly.inputs.Align.RIGHT);
    }
    if (!this.initialized_ && this.getInput('VALUE')) {
      this.removeInput('VALUE');
    }
  }
};

Blockly.Blocks['ast_AnnAssign'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("set")
      .appendField(new Blockly.FieldVariable("item"), "TARGET")
      .appendField(":")
      .appendField(new Blockly.FieldDropdown(BlockMirrorTextToBlocks.ANNOTATION_OPTIONS), "ANNOTATION");
    this.appendValueInput("VALUE")
      .setCheck(null)
      .appendField("=");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BlockMirrorTextToBlocks.COLOR.VARIABLES);
    this.strAnnotations_ = false;
    this.initialized_ = true;
  },
  /**
   * Create XML to represent list inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    let container = document.createElement('mutation');
    container.setAttribute('str', this.strAnnotations_);
    container.setAttribute('initialized', this.initialized_);
    return container;
  },
  /**
   * Parse XML to restore the list inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.strAnnotations_ = "true" === xmlElement.getAttribute('str');
    this.initialized_ = "true" === xmlElement.getAttribute('initialized');
    this.updateShape_();
  },
  updateShape_: function (block) {
    // Add new inputs.
    if (this.initialized_ && !this.getInput('VALUE')) {
      this.appendValueInput('VALUE')
        .appendField('=')
        .setAlign(Blockly.inputs.Align.RIGHT);
    }
    if (!this.initialized_ && this.getInput('VALUE')) {
      this.removeInput('VALUE');
    }
  }
};


Blockly.Blocks['ast_AugAssign'] = {
  init: function () {
    let block = this;
    this.simpleTarget_ = true;
    this.allOptions_ = false;
    this.initialPreposition_ = "by";
    this.appendDummyInput("OP")
      .appendField(new Blockly.FieldDropdown(function () {
        return block.allOptions_ ?
          BlockMirrorTextToBlocks.BINOPS_AUGASSIGN_DISPLAY_FULL :
          BlockMirrorTextToBlocks.BINOPS_AUGASSIGN_DISPLAY
      }, function (value) {
        let block = this.sourceBlock_;
        block.updatePreposition_(value);
      }), "OP_NAME")
      .appendField(" ");
    this.appendDummyInput('PREPOSITION_ANCHOR')
      .setAlign(Blockly.inputs.Align.RIGHT)
      .appendField("by", 'PREPOSITION');
    this.appendValueInput('VALUE');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BlockMirrorTextToBlocks.COLOR.MATH);
    this.updateShape_();
    this.updatePreposition_(this.initialPreposition_);
  },

  updatePreposition_: function (value) {
    let preposition = BlockMirrorTextToBlocks.BINOPS_AUGASSIGN_PREPOSITION[value];
    this.setFieldValue(preposition, 'PREPOSITION')
  },
  /**
   * Create XML to represent list inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    let container = document.createElement('mutation');
    container.setAttribute('simple', this.simpleTarget_);
    container.setAttribute('options', this.allOptions_);
    container.setAttribute('preposition', this.initialPreposition_);
    return container;
  },
  /**
   * Parse XML to restore the list inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.simpleTarget_ = "true" === xmlElement.getAttribute('simple');
    this.allOptions_ = "true" === xmlElement.getAttribute('options');
    this.initialPreposition_ = xmlElement.getAttribute('preposition');
    this.updateShape_();
    this.updatePreposition_(this.initialPreposition_);
  },
  updateShape_: function (block) {
    // Add new inputs.
    this.getField("OP_NAME").getOptions(false);
    if (this.simpleTarget_) {
      if (!this.getInput('VAR_ANCHOR')) {
        this.appendDummyInput('VAR_ANCHOR')
          .appendField(new Blockly.FieldVariable("variable"), "VAR");
        this.moveInputBefore('VAR_ANCHOR', 'PREPOSITION_ANCHOR')
      }
      if (this.getInput('TARGET')) {
        this.removeInput('TARGET');
      }
    } else {
      if (this.getInput('VAR_ANCHOR')) {
        this.removeInput('VAR_ANCHOR');
      }
      if (!this.getInput('TARGET')) {
        this.appendValueInput('TARGET');
        this.moveInputBefore('TARGET', 'PREPOSITION_ANCHOR')
      }
    }
  }
};

// ast_Call
Blockly.Blocks['ast_Call'] = {
  /**
   * Block for calling a procedure with no return value.
   * @this Blockly.Block
   */
  init: function () {
      this.givenColour_ = BlockMirrorTextToBlocks.COLOR.FUNCTIONS
      this.setInputsInline(true);
      // Regular ('NAME') or Keyword (either '**' or '*NAME')
      this.arguments_ = [];
      this.argumentVarModels_ = [];
      // acbart: Added count to keep track of unused parameters
      this.argumentCount_ = 0;
      this.quarkConnections_ = {};
      this.quarkIds_ = null;
      // acbart: Show parameter names, if they exist
      this.showParameterNames_ = false;
      // acbart: Whether this block returns
      this.returns_ = true;
      // acbart: added simpleName to handle complex function calls (e.g., chained)
      this.isMethod_ = false;
      this.name_ = null;
      this.message_ = "function";
      this.premessage_ = "";
      this.module_ = "";
      this.updateShape_();
  },

  /**
   * Returns the name of the procedure this block calls.
   * @return {string} Procedure name.
   * @this Blockly.Block
   */
  getProcedureCall: function () {
      return this.name_;
  },
  /**
   * Notification that a procedure is renaming.
   * If the name matches this block's procedure, rename it.
   * Also rename if it was previously null.
   * @param {string} oldName Previous name of procedure.
   * @param {string} newName Renamed procedure.
   * @this Blockly.Block
   */
  renameProcedure: function (oldName, newName) {
      if (this.name_ === null ||
          Blockly.Names.equals(oldName, this.name_)) {
          this.name_ = newName;
          this.updateShape_();
      }
  },
  /**
   * Notification that the procedure's parameters have changed.
   * @param {!Array.<string>} paramNames New param names, e.g. ['x', 'y', 'z'].
   * @param {!Array.<string>} paramIds IDs of params (consistent for each
   *     parameter through the life of a mutator, regardless of param renaming),
   *     e.g. ['piua', 'f8b_', 'oi.o'].
   * @private
   * @this Blockly.Block
   */
  setProcedureParameters_: function (paramNames, paramIds) {
      // Data structures:
      // this.arguments = ['x', 'y']
      //     Existing param names.
      // this.quarkConnections_ {piua: null, f8b_: Blockly.Connection}
      //     Look-up of paramIds to connections plugged into the call block.
      // this.quarkIds_ = ['piua', 'f8b_']
      //     Existing param IDs.
      // Note that quarkConnections_ may include IDs that no longer exist, but
      // which might reappear if a param is reattached in the mutator.
      var defBlock = Blockly.Procedures.getDefinition(this.getProcedureCall(),
          this.workspace);
      var mutatorOpen = defBlock && defBlock.mutator &&
          defBlock.mutator.isVisible();
      if (!mutatorOpen) {
          this.quarkConnections_ = {};
          this.quarkIds_ = null;
      }
      if (!paramIds) {
          // Reset the quarks (a mutator is about to open).
          return false;
      }
      // Test arguments (arrays of strings) for changes. '\n' is not a valid
      // argument name character, so it is a valid delimiter here.
      if (paramNames.join('\n') == this.arguments_.join('\n')) {
          // No change.
          this.quarkIds_ = paramIds;
          return false;
      }
      if (paramIds.length !== paramNames.length) {
          throw RangeError('paramNames and paramIds must be the same length.');
      }
      this.setCollapsed(false);
      if (!this.quarkIds_) {
          // Initialize tracking for this block.
          this.quarkConnections_ = {};
          this.quarkIds_ = [];
      }
      // Switch off rendering while the block is rebuilt.
      var savedRendered = this.rendered;
      this.rendered = false;
      // Update the quarkConnections_ with existing connections.
      for (let i = 0; i < this.arguments_.length; i++) {
          var input = this.getInput('ARG' + i);
          if (input) {
              let connection = input.connection.targetConnection;
              this.quarkConnections_[this.quarkIds_[i]] = connection;
              if (mutatorOpen && connection &&
                  paramIds.indexOf(this.quarkIds_[i]) === -1) {
                  // This connection should no longer be attached to this block.
                  connection.disconnect();
                  connection.getSourceBlock().bumpNeighbours_();
              }
          }
      }
      // Rebuild the block's arguments.
      this.arguments_ = [].concat(paramNames);
      this.argumentCount_ = this.arguments_.length;
      // And rebuild the argument model list.
      this.argumentVarModels_ = [];
      /*
      // acbart: Function calls don't create variables, what do they know?
      for (let i = 0; i < this.arguments_.length; i++) {
          let argumentName = this.arguments_[i];
          var variable = Blockly.Variables.getVariable(
              this.workspace, null, this.arguments_[i], '__');
          if (variable) {
              this.argumentVarModels_.push(variable);
          }
      }*/

      this.updateShape_();
      this.quarkIds_ = paramIds;
      // Reconnect any child blocks.
      if (this.quarkIds_) {
          for (let i = 0; i < this.arguments_.length; i++) {
              var quarkId = this.quarkIds_[i];
              if (quarkId in this.quarkConnections_) {
                  let connection = this.quarkConnections_[quarkId];
                  // if (!Blockly.Mutator.reconnect(connection, this, 'ARG' + i)) {
                  //     // Block no longer exists or has been attached elsewhere.
                  //     delete this.quarkConnections_[quarkId];
                  // }
              }
          }
      }
      // Restore rendering and show the changes.
      this.rendered = savedRendered;
      if (this.rendered) {
          this.render();
      }
      return true;
  },
  /**
   * Modify this block to have the correct number of arguments.
   * @private
   * @this Blockly.Block
   */
  updateShape_: function () {
      // If it's a method, add in the caller
      if (this.isMethod_ && !this.getInput('FUNC')) {
          let func = this.appendValueInput('FUNC');
          // If there's a premessage, add it in
          if (this.premessage_ !== "") {
              func.appendField(this.premessage_);
          }
      } else if (!this.isMethod_ && this.getInput('FUNC')) {
          this.removeInput('FUNC');
      }

      let drawnArgumentCount = this.getDrawnArgumentCount_();
      let message = this.getInput('MESSAGE_AREA')
      // Zero arguments, just do {message()}
      if (drawnArgumentCount === 0) {
          if (message) {
              message.removeField('MESSAGE');
          } else {
              message = this.appendDummyInput('MESSAGE_AREA')
                  .setAlign(1);
          }
          message.appendField(new Blockly.FieldLabel(this.message_ + "\ ("), 'MESSAGE');
          // One argument, no MESSAGE_AREA
      } else if (message) {
          this.removeInput('MESSAGE_AREA');
      }
      // Process arguments
      let i;
      for (i = 0; i < drawnArgumentCount; i++) {
          let argument = this.arguments_[i];
          let argumentName = this.parseArgument_(argument);
          if (i === 0) {
              argumentName = this.message_ + "\ (" + argumentName;
          }
          let field = this.getField('ARGNAME' + i);
          if (field) {
              // Ensure argument name is up to date.
              // The argument name field is deterministic based on the mutation,
              // no need to fire a change event.
              Blockly.Events.disable();
              try {
                  field.setValue(argumentName);
              } finally {
                  Blockly.Events.enable();
              }
          } else {
              // Add new input.
              field = new Blockly.FieldLabel(argumentName);
              this.appendValueInput('ARG' + i)
                  .setAlign(1)
                  .appendField(field, 'ARGNAME' + i)
                  .init();
          }
          if (argumentName) {
              field.setVisible(true);
          } else {
              field.setVisible(false);
          }
      }

      // Closing parentheses
      if (!this.getInput('CLOSE_PAREN')) {
          this.appendDummyInput('CLOSE_PAREN')
              .setAlign(1)
              .appendField(new Blockly.FieldLabel(")"));
      }

      // Move everything into place
      if (drawnArgumentCount === 0) {
          if (this.isMethod_) {
              this.moveInputBefore('FUNC', 'MESSAGE_AREA');
          }
          this.moveInputBefore('MESSAGE_AREA', 'CLOSE_PAREN');
      } else {
          if (this.isMethod_) {
              this.moveInputBefore('FUNC', 'CLOSE_PAREN');
          }
      }
      for (let j = 0; j < i; j++) {
          this.moveInputBefore('ARG' + j, 'CLOSE_PAREN')
      }

      // Set return state
      this.setReturn_(this.returns_, false);
      // Remove deleted inputs.
      while (this.getInput('ARG' + i)) {
          this.removeInput('ARG' + i);
          i++;
      }

      this.setColour(this.givenColour_);
  }
  ,
  /**
   * Create XML to represent the (non-editable) name and arguments.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
      var container = document.createElement('mutation');
      let name = this.getProcedureCall();
      container.setAttribute('name', name === null ? '*' : name);
      container.setAttribute('arguments', this.argumentCount_);
      container.setAttribute('returns', this.returns_);
      container.setAttribute('parameters', this.showParameterNames_);
      container.setAttribute('method', this.isMethod_);
      container.setAttribute('message', this.message_);
      container.setAttribute('premessage', this.premessage_);
      container.setAttribute('module', this.module_);
      container.setAttribute('colour', this.givenColour_);
      for (var i = 0; i < this.arguments_.length; i++) {
          var parameter = document.createElement('arg');
          parameter.setAttribute('name', this.arguments_[i]);
          container.appendChild(parameter);
      }
      return container;
  },
  /**
   * Parse XML to restore the (non-editable) name and parameters.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
      this.name_ = xmlElement.getAttribute('name');
      this.name_ = this.name_ === '*' ? null : this.name_;
      this.argumentCount_ = parseInt(xmlElement.getAttribute('arguments'), 10);
      this.showParameterNames_ = "true" === xmlElement.getAttribute('parameters');
      this.returns_ = "true" === xmlElement.getAttribute('returns');
      this.isMethod_ = "true" === xmlElement.getAttribute('method');
      this.message_ = xmlElement.getAttribute('message');
      this.premessage_ = xmlElement.getAttribute('premessage');
      this.module_ = xmlElement.getAttribute('module');
      this.givenColour_ = parseInt(xmlElement.getAttribute('colour'), 10);

      var args = [];
      var paramIds = [];
      for (var i = 0, childNode; childNode = xmlElement.childNodes[i]; i++) {
          if (childNode.nodeName.toLowerCase() === 'arg') {
              args.push(childNode.getAttribute('name'));
              paramIds.push(childNode.getAttribute('paramId'));
          }
      }
      let result = this.setProcedureParameters_(args, paramIds);
      if (!result) {
          this.updateShape_();
      }
      if (this.name_ !== null) {
          this.renameProcedure(this.getProcedureCall(), this.name_);
      }
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array.<!Blockly.VariableModel>} List of variable models.
   * @this Blockly.Block
   */
  getVarModels: function () {
      return this.argumentVarModels_;
  }
  ,
  /**
   * Add menu option to find the definition block for this call.
   * @param {!Array} options List of menu options to add to.
   * @this Blockly.Block
   */
  customContextMenu: function (options) {
      if (!this.workspace.isMovable()) {
          // If we center on the block and the workspace isn't movable we could
          // loose blocks at the edges of the workspace.
          return;
      }

      let workspace = this.workspace;
      let block = this;

      // Highlight Definition
      let option = { enabled: true };
      option.text = Blockly.Msg['PROCEDURES_HIGHLIGHT_DEF'];
      let name = this.getProcedureCall();
      option.callback = function () {
          let def = Blockly.Procedures.getDefinition(name, workspace);
          if (def) {
              workspace.centerOnBlock(def.id);
              def.select();
          }
      };
      options.push(option);

      // Show Parameter Names
      options.push({
          enabled: true,
          text: "Show/Hide parameters",
          callback: function () {
              block.showParameterNames_ = !block.showParameterNames_;
              block.updateShape_();
              block.render();
          }
      });

      // Change Return Type
      options.push({
          enabled: true,
          text: this.returns_ ? "Make statement" : "Make expression",
          callback: function () {
              block.returns_ = !block.returns_;
              block.setReturn_(block.returns_, true);
          }
      })
  },
  /**
   * Notification that the procedure's return state has changed.
   * @param {boolean} returnState New return state
   * @param forceRerender Whether to render
   * @this Blockly.Block
   */
  setReturn_: function (returnState, forceRerender) {
      this.unplug(true);
      if (returnState) {
          this.setPreviousStatement(false);
          this.setNextStatement(false);
          this.setOutput(true);
      } else {
          this.setOutput(false);
          this.setPreviousStatement(true);
          this.setNextStatement(true);
      }
      if (forceRerender) {
          if (this.rendered) {
              this.render();
          }
      }
  },
  //defType_: 'procedures_defnoreturn',
  parseArgument_: function (argument) {
      if (argument.startsWith('KWARGS:')) {
          // KWARG
          return "unpack";
      } else if (argument.startsWith('KEYWORD:')) {
          return argument.substring(8) + "=";
      } else {
          if (this.showParameterNames_) {
              if (argument.startsWith("KNOWN_ARG:")) {
                  return argument.substring(10) + "=";
              }
          }
      }
      return "";
  },
  getDrawnArgumentCount_: function () {
      return Math.min(this.argumentCount_, this.arguments_.length);
  }
};
Blockly.Blocks['ast_ClassDef'] = {
  init: function () {
    this.decorators_ = 0;
    this.bases_ = 0;
    this.keywords_ = 0;
    this.appendDummyInput('HEADER')
      .appendField("Class")
      .appendField(new Blockly.FieldVariable("item"), "NAME");
    this.appendStatementInput("BODY")
      .setCheck(null);
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BlockMirrorTextToBlocks.COLOR.OO);
    this.updateShape_();
  },
  // TODO: Not mutable currently
  updateShape_: function () {
    for (let i = 0; i < this.decorators_; i++) {
      let input = this.appendValueInput("DECORATOR" + i)
        .setCheck(null)
        .setAlign(Blockly.inputs.Align.RIGHT);
      if (i === 0) {
        input.appendField("decorated by");
      }
      this.moveInputBefore('DECORATOR' + i, 'BODY');
    }
    for (let i = 0; i < this.bases_; i++) {
      let input = this.appendValueInput("BASE" + i)
        .setCheck(null)
        .setAlign(Blockly.inputs.Align.RIGHT);
      if (i === 0) {
        input.appendField("inherits from");
      }
      this.moveInputBefore('BASE' + i, 'BODY');
    }

    for (let i = 0; i < this.keywords_; i++) {
      this.appendValueInput("KEYWORDVALUE" + i)
        .setCheck(null)
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField(new Blockly.FieldTextInput("metaclass"), "KEYWORDNAME" + i)
        .appendField("=");
      this.moveInputBefore('KEYWORDVALUE' + i, 'BODY');
    }
  },
  /**
   * Create XML to represent the (non-editable) name and arguments.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    let container = document.createElement('mutation');
    container.setAttribute('decorators', this.decorators_);
    container.setAttribute('bases', this.bases_);
    container.setAttribute('keywords', this.keywords_);
    return container;
  },
  /**
   * Parse XML to restore the (non-editable) name and parameters.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.decorators_ = parseInt(xmlElement.getAttribute('decorators'), 10);
    this.bases_ = parseInt(xmlElement.getAttribute('bases'), 10);
    this.keywords_ = parseInt(xmlElement.getAttribute('keywords'), 10);
    this.updateShape_();
  },
};

Blockly.Blocks['ast_Comp_create_with_container'] = {
  /**
   * Mutator block for dict container.
   * @this Blockly.Block
   */
  init: function () {
    this.setColour(BlockMirrorTextToBlocks.COLOR.SEQUENCES);
    this.appendDummyInput()
      .appendField('Add new comprehensions below');
    this.appendDummyInput()
      .appendField('   For clause');
    this.appendStatementInput('STACK');
    this.contextMenu = false;
  }
};


Blockly.Blocks['ast_Comp_create_with_for'] = {
  /**
   * Mutator block for adding items.
   * @this Blockly.Block
   */
  init: function () {
    this.setColour(BlockMirrorTextToBlocks.COLOR.SEQUENCES);
    this.appendDummyInput()
      .appendField('For clause');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
  }
};

Blockly.Blocks['ast_Comp_create_with_if'] = {
  /**
   * Mutator block for adding items.
   * @this Blockly.Block
   */
  init: function () {
    this.setColour(BlockMirrorTextToBlocks.COLOR.SEQUENCES);
    this.appendDummyInput()
      .appendField('If clause');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
  }
};

['ListComp', 'SetComp', 'GeneratorExp', 'DictComp'].forEach(function (kind) {
  Blockly.Blocks['ast_' + kind] = {
    /**
     * Block for creating a dict with any number of elements of any type.
     * @this Blockly.Block
     */
    init: function () {
      this.setStyle('loop_blocks');
      this.setColour(BlockMirrorTextToBlocks.COMP_SETTINGS[kind].color);
      this.itemCount_ = 3;
      let input = this.appendValueInput("ELT")
        .appendField(BlockMirrorTextToBlocks.COMP_SETTINGS[kind].start);
      if (kind === 'DictComp') {
        input.setCheck('DictPair');
      }
      this.appendDummyInput("END_BRACKET")
        .appendField(BlockMirrorTextToBlocks.COMP_SETTINGS[kind].end);
      this.updateShape_();
      this.setOutput(true);
      // this.setMutator(new Blockly.Mutator(['ast_Comp_create_with_for', 'ast_Comp_create_with_if']));
    },
    /**
     * Create XML to represent dict inputs.
     * @return {!Element} XML storage element.
     * @this Blockly.Block
     */
    mutationToDom: function () {
      var container = document.createElement('mutation');
      container.setAttribute('items', this.itemCount_);
      return container;
    },
    /**
     * Parse XML to restore the dict inputs.
     * @param {!Element} xmlElement XML storage element.
     * @this Blockly.Block
     */
    domToMutation: function (xmlElement) {
      this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
      this.updateShape_();
    },
    /**
     * Populate the mutator's dialog with this block's components.
     * @param {!Blockly.Workspace} workspace Mutator's workspace.
     * @return {!Blockly.Block} Root block in mutator.
     * @this Blockly.Block
     */
    decompose: function (workspace) {
      var containerBlock = workspace.newBlock('ast_Comp_create_with_container');
      containerBlock.initSvg();
      var connection = containerBlock.getInput('STACK').connection;
      let generators = [];
      for (var i = 1; i < this.itemCount_; i++) {
        let generator = this.getInput('GENERATOR' + i).connection;
        let createName;
        if (generator.targetConnection.getSourceBlock().type === 'ast_comprehensionIf') {
          createName = 'ast_Comp_create_with_if';
        } else if (generator.targetConnection.getSourceBlock().type === 'ast_comprehensionFor') {
          createName = 'ast_Comp_create_with_for';
        } else {
          throw Error("Unknown block type: " + generator.targetConnection.getSourceBlock().type);
        }
        var itemBlock = workspace.newBlock(createName);
        itemBlock.initSvg();
        connection.connect(itemBlock.previousConnection);
        connection = itemBlock.nextConnection;
        generators.push(itemBlock);
      }
      return containerBlock;
    },
    /**
     * Reconfigure this block based on the mutator dialog's components.
     * @param {!Blockly.Block} containerBlock Root block in mutator.
     * @this Blockly.Block
     */
    compose: function (containerBlock) {
      var itemBlock = containerBlock.getInputTargetBlock('STACK');
      // Count number of inputs.
      var connections = [containerBlock.valueConnection_];
      let blockTypes = ['ast_Comp_create_with_for'];
      while (itemBlock) {
        connections.push(itemBlock.valueConnection_);
        blockTypes.push(itemBlock.type);
        itemBlock = itemBlock.nextConnection &&
          itemBlock.nextConnection.targetBlock();
      }
      // Disconnect any children that don't belong.
      for (var i = 1; i < this.itemCount_; i++) {
        var connection = this.getInput('GENERATOR' + i).connection.targetConnection;
        if (connection && connections.indexOf(connection) === -1) {
          let connectedBlock = connection.getSourceBlock();
          if (connectedBlock.type === 'ast_comprehensionIf') {
            let testField = connectedBlock.getInput('TEST');
            if (testField.connection.targetConnection) {
              testField.connection.targetConnection.getSourceBlock().unplug(true);
            }
          } else if (connectedBlock.type === 'ast_comprehensionFor') {
            let iterField = connectedBlock.getInput('ITER');
            if (iterField.connection.targetConnection) {
              iterField.connection.targetConnection.getSourceBlock().unplug(true);
            }
            let targetField = connectedBlock.getInput('TARGET');
            if (targetField.connection.targetConnection) {
              targetField.connection.targetConnection.getSourceBlock().unplug(true);
            }
          } else {
            throw Error("Unknown block type: " + connectedBlock.type);
          }
          connection.disconnect();
          connection.getSourceBlock().dispose();
        }
      }
      this.itemCount_ = connections.length;
      this.updateShape_();
      // Reconnect any child blocks.
      for (var i = 1; i < this.itemCount_; i++) {
        // Blockly.Mutator.reconnect(connections[i], this, 'GENERATOR' + i);
        // TODO: glitch when inserting into middle, deletes children values
        if (!connections[i]) {
          let createName;
          if (blockTypes[i] === 'ast_Comp_create_with_if') {
            createName = 'ast_comprehensionIf';
          } else if (blockTypes[i] === 'ast_Comp_create_with_for') {
            createName = 'ast_comprehensionFor';
          } else {
            throw Error("Unknown block type: " + blockTypes[i]);
          }
          let itemBlock = this.workspace.newBlock(createName);
          itemBlock.setDeletable(false);
          itemBlock.setMovable(false);
          itemBlock.initSvg();
          this.getInput('GENERATOR' + i).connection.connect(itemBlock.outputConnection);
          itemBlock.render();
          //this.get(itemBlock, 'ADD'+i)
        }
      }
    },
    /**
     * Store pointers to any connected child blocks.
     * @param {!Blockly.Block} containerBlock Root block in mutator.
     * @this Blockly.Block
     */
    saveConnections: function (containerBlock) {
      containerBlock.valueConnection_ = this.getInput('GENERATOR0').connection.targetConnection;
      var itemBlock = containerBlock.getInputTargetBlock('STACK');
      var i = 1;
      while (itemBlock) {
        var input = this.getInput('GENERATOR' + i);
        itemBlock.valueConnection_ = input && input.connection.targetConnection;
        i++;
        itemBlock = itemBlock.nextConnection &&
          itemBlock.nextConnection.targetBlock();
      }
    },
    /**
     * Modify this block to have the correct number of inputs.
     * @private
     * @this Blockly.Block
     */
    updateShape_: function () {
      // Add new inputs.
      for (var i = 0; i < this.itemCount_; i++) {
        if (!this.getInput('GENERATOR' + i)) {
          let input = this.appendValueInput('GENERATOR' + i);
          if (i === 0) {
            input.setCheck("ComprehensionFor");
          } else {
            input.setCheck(["ComprehensionFor", "ComprehensionIf"]);
          }
          this.moveInputBefore('GENERATOR' + i, 'END_BRACKET');
        }
      }
      // Remove deleted inputs.
      while (this.getInput('GENERATOR' + i)) {
        this.removeInput('GENERATOR' + i);
        i++;
      }
    }
  };
});

// ast_Delete
Blockly.Blocks['ast_Delete'] = {
  init: function () {
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BlockMirrorTextToBlocks.COLOR.VARIABLES);
    this.targetCount_ = 1;

    this.appendDummyInput()
      .appendField("delete");
    this.updateShape_();
  },
  updateShape_: function () {
    // Add new inputs.
    for (var i = 0; i < this.targetCount_; i++) {
      if (!this.getInput('TARGET' + i)) {
        var input = this.appendValueInput('TARGET' + i);
        if (i !== 0) {
          input.appendField(',').setAlign(Blockly.inputs.Align.RIGHT);
        }
      }
    }
    // Remove deleted inputs.
    while (this.getInput('TARGET' + i)) {
      this.removeInput('TARGET' + i);
      i++;
    }
  },
  /**
   * Create XML to represent list inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    var container = document.createElement('mutation');
    container.setAttribute('targets', this.targetCount_);
    return container;
  },
  /**
   * Parse XML to restore the list inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.targetCount_ = parseInt(xmlElement.getAttribute('targets'), 10);
    this.updateShape_();
  },
};

// ast_Dict
Blockly.Blocks['ast_DictItem'] = {
  init: function () {
    this.appendValueInput("KEY")
      .setCheck(null);
    this.appendValueInput("VALUE")
      .setCheck(null)
      .appendField(":");
    this.setInputsInline(true);
    this.setOutput(true, "DictPair");
    this.setColour(BlockMirrorTextToBlocks.COLOR.DICTIONARY);
  }
};

Blockly.Blocks['ast_Dict'] = {
  /**
   * Block for creating a dict with any number of elements of any type.
   * @this Blockly.Block
   */
  init: function () {
    this.setColour(BlockMirrorTextToBlocks.COLOR.DICTIONARY);
    this.itemCount_ = 3;
    this.updateShape_();
    this.setOutput(true, 'Dict');
    this.setMutator(new Blockly.icons.MutatorIcon(['ast_Dict_create_with_item'], this));
  },
  /**
   * Create XML to represent dict inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    var container = document.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },
  /**
   * Parse XML to restore the dict inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
    this.updateShape_();
  },
  /**
   * Populate the mutator's dialog with this block's components.
   * @param {!Blockly.Workspace} workspace Mutator's workspace.
   * @return {!Blockly.Block} Root block in mutator.
   * @this Blockly.Block
   */
  decompose: function (workspace) {
    var containerBlock = workspace.newBlock('ast_Dict_create_with_container');
    containerBlock.initSvg();
    var connection = containerBlock.getInput('STACK').connection;
    for (var i = 0; i < this.itemCount_; i++) {
      var itemBlock = workspace.newBlock('ast_Dict_create_with_item');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },
  /**
   * Reconfigure this block based on the mutator dialog's components.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this Blockly.Block
   */
  compose: function (containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    // Count number of inputs.
    var connections = [];
    while (itemBlock) {
      connections.push(itemBlock.valueConnection_);
      itemBlock = itemBlock.nextConnection &&
        itemBlock.nextConnection.targetBlock();
    }
    // Disconnect any children that don't belong.
    for (var i = 0; i < this.itemCount_; i++) {
      var connection = this.getInput('ADD' + i).connection.targetConnection;
      if (connection && connections.indexOf(connection) == -1) {
        let key = connection.getSourceBlock().getInput("KEY");
        if (key.connection.targetConnection) {
          key.connection.targetConnection.getSourceBlock().unplug(true);
        }
        let value = connection.getSourceBlock().getInput("VALUE");
        if (value.connection.targetConnection) {
          value.connection.targetConnection.getSourceBlock().unplug(true);
        }
        connection.disconnect();
        connection.getSourceBlock().dispose();
      }
    }
    this.itemCount_ = connections.length;
    this.updateShape_();
    // Reconnect any child blocks.
    // for (var i = 0; i < this.itemCount_; i++) {
    //     // Blockly.icons.MutatorIcon.reconnect(connections[i], this, 'ADD' + i);
    //     if (!connections[i]) {
    //         let itemBlock = this.workspace.newBlock('ast_DictItem');
    //         itemBlock.setDeletable(false);
    //         itemBlock.setMovable(false);
    //         itemBlock.initSvg();
    //         this.getInput('ADD' + i).connection.connect(itemBlock.outputConnection);
    //         itemBlock.render();
    //         //this.get(itemBlock, 'ADD'+i)
    //     }
    // }
  },
  /**
   * Store pointers to any connected child blocks.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this Blockly.Block
   */
  saveConnections: function (containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    var i = 0;
    while (itemBlock) {
      var input = this.getInput('ADD' + i);
      itemBlock.valueConnection_ = input && input.connection.targetConnection;
      i++;
      itemBlock = itemBlock.nextConnection &&
        itemBlock.nextConnection.targetBlock();
    }
  },
  /**
   * Modify this block to have the correct number of inputs.
   * @private
   * @this Blockly.Block
   */
  updateShape_: function () {
    if (this.itemCount_ && this.getInput('EMPTY')) {
      this.removeInput('EMPTY');
    } else if (!this.itemCount_ && !this.getInput('EMPTY')) {
      this.appendDummyInput('EMPTY')
        .appendField('empty dictionary');
    }
    // Add new inputs.
    for (var i = 0; i < this.itemCount_; i++) {
      if (!this.getInput('ADD' + i)) {
        var input = this.appendValueInput('ADD' + i)
          .setCheck('DictPair');
        if (i === 0) {
          input.appendField('create dict with').setAlign(Blockly.inputs.Align.RIGHT);
        }
      }
    }
    // Remove deleted inputs.
    while (this.getInput('ADD' + i)) {
      this.removeInput('ADD' + i);
      i++;
    }
    // Add the trailing "}"
    /*
    if (this.getInput('TAIL')) {
        this.removeInput('TAIL');
    }
    if (this.itemCount_) {
        let tail = this.appendDummyInput('TAIL')
            .appendField('}');
        tail.setAlign(Blockly.inputs.Align.RIGHT);
    }*/
  }
};
Blockly.Blocks['ast_Dict_create_with_container'] = {
  /**
   * Mutator block for dict container.
   * @this Blockly.Block
   */
  init: function () {
    this.setColour(BlockMirrorTextToBlocks.COLOR.DICTIONARY);
    this.appendDummyInput()
      .appendField('Add new dict elements below');
    this.appendStatementInput('STACK');
    this.contextMenu = false;
  }
};

Blockly.Blocks['ast_Dict_create_with_item'] = {
  /**
   * Mutator block for adding items.
   * @this Blockly.Block
   */
  init: function () {
    this.setColour(BlockMirrorTextToBlocks.COLOR.DICTIONARY);
    this.appendDummyInput()
      .appendField('Element');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
  }
};

Blockly.Blocks['ast_FunctionDef'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("define")
      .appendField(new Blockly.FieldTextInput("function"), "NAME");
    this.decoratorsCount_ = 0;
    this.parametersCount_ = 0;
    this.hasReturn_ = false;
    this.mutatorComplexity_ = 0;
    this.appendStatementInput("BODY")
      .setCheck(null);
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BlockMirrorTextToBlocks.COLOR.FUNCTIONS);
    this.updateShape_();
    this.setMutator(new Blockly.icons.MutatorIcon(['ast_FunctionMutantParameter',
      'ast_FunctionMutantParameterType'], this));
  },
  /**
   * Create XML to represent list inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    var container = document.createElement('mutation');
    container.setAttribute('decorators', this.decoratorsCount_);
    container.setAttribute('parameters', this.parametersCount_);
    container.setAttribute('returns', this.hasReturn_);
    return container;
  },
  /**
   * Parse XML to restore the list inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.decoratorsCount_ = parseInt(xmlElement.getAttribute('decorators'), 10);
    this.parametersCount_ = parseInt(xmlElement.getAttribute('parameters'), 10);
    this.hasReturn_ = "true" === xmlElement.getAttribute('returns');
    this.updateShape_();
  },
  setReturnAnnotation_: function (status) {
    let currentReturn = this.getInput('RETURNS');
    if (status) {
      if (!currentReturn) {
        this.appendValueInput("RETURNS")
          .setCheck(null)
          .setAlign(Blockly.inputs.Align.RIGHT)
          .appendField("returns");
      }
      this.moveInputBefore('RETURNS', 'BODY');
    } else if (!status && currentReturn) {
      this.removeInput('RETURNS');
    }
    this.hasReturn_ = status;
  },
  updateShape_: function () {
    // Set up decorators and parameters
    let block = this;
    let position = 1;
    [
      ['DECORATOR', 'decoratorsCount_', null, 'decorated by'],
      ['PARAMETER', 'parametersCount_', 'Parameter', 'parameters:']
    ].forEach(function (childTypeTuple) {
      let childTypeName = childTypeTuple[0],
        countVariable = childTypeTuple[1],
        inputCheck = childTypeTuple[2],
        childTypeMessage = childTypeTuple[3];
      for (var i = 0; i < block[countVariable]; i++) {
        if (!block.getInput(childTypeName + i)) {
          let input = block.appendValueInput(childTypeName + i)
            .setCheck(inputCheck)
            .setAlign(Blockly.inputs.Align.RIGHT);
          if (i === 0) {
            input.appendField(childTypeMessage);
          }
        }
        block.moveInputBefore(childTypeName + i, 'BODY');
      }
      // Remove deleted inputs.
      while (block.getInput(childTypeName + i)) {
        block.removeInput(childTypeName + i);
        i++;
      }
    });
    // Set up optional Returns annotation
    this.setReturnAnnotation_(this.hasReturn_);
  },
  /**
   * Populate the mutator's dialog with this block's components.
   * @param {!Blockly.Workspace} workspace Mutator's workspace.
   * @return {!Blockly.Block} Root block in mutator.
   * @this Blockly.Block
   */
  decompose: function (workspace) {
    var containerBlock = workspace.newBlock('ast_FunctionHeaderMutator');
    containerBlock.initSvg();

    // Check/uncheck the allow statement box.
    if (this.getInput('RETURNS')) {
      containerBlock.setFieldValue(
        this.hasReturn_ ? 'TRUE' : 'FALSE', 'RETURNS');
    } else {
      // TODO: set up "canReturns" for lambda mode
      //containerBlock.getField('RETURNS').setVisible(false);
    }

    // Set up parameters
    var connection = containerBlock.getInput('STACK').connection;
    let parameters = [];
    for (var i = 0; i < this.parametersCount_; i++) {
      let parameter = this.getInput('PARAMETER' + i).connection;
      let sourceType = parameter.targetConnection.getSourceBlock().type;
      let createName = 'ast_FunctionMutant' + sourceType.substring('ast_Function'.length);
      var itemBlock = workspace.newBlock(createName);
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
      parameters.push(itemBlock);
    }
    return containerBlock;
  },
  /**
   * Reconfigure this block based on the mutator dialog's components.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this Blockly.Block
   */
  compose: function (containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    // Count number of inputs.
    var connections = [];
    let blockTypes = [];
    while (itemBlock) {
      connections.push(itemBlock.valueConnection_);
      blockTypes.push(itemBlock.type);
      itemBlock = itemBlock.nextConnection &&
        itemBlock.nextConnection.targetBlock();
    }
    // Disconnect any children that don't belong.
    for (let i = 0; i < this.parametersCount_; i++) {
      var connection = this.getInput('PARAMETER' + i).connection.targetConnection;
      if (connection && connections.indexOf(connection) === -1) {
        // Disconnect all children of this block
        let connectedBlock = connection.getSourceBlock();
        for (let j = 0; j < connectedBlock.inputList.length; j++) {
          let field = connectedBlock.inputList[j].connection;
          if (field && field.targetConnection) {
            field.targetConnection.getSourceBlock().unplug(true);
          }
        }
        connection.disconnect();
        connection.getSourceBlock().dispose();
      }
    }
    this.parametersCount_ = connections.length;
    this.updateShape_();
    // Reconnect any child blocks.
    for (let i = 0; i < this.parametersCount_; i++) {
      // Blockly.icons.MutatorIcon.reconnect(connections[i], this, 'PARAMETER' + i);
      if (!connections[i]) {
        let createName = 'ast_Function' + blockTypes[i].substring('ast_FunctionMutant'.length);
        let itemBlock = this.workspace.newBlock(createName);
        itemBlock.setDeletable(false);
        itemBlock.setMovable(false);
        itemBlock.initSvg();
        this.getInput('PARAMETER' + i).connection.connect(itemBlock.outputConnection);
        itemBlock.render();
        //this.get(itemBlock, 'ADD'+i)
      }
    }
    // Show/hide the returns annotation
    let hasReturns = containerBlock.getFieldValue('RETURNS');
    if (hasReturns !== null) {
      hasReturns = hasReturns === 'TRUE';
      if (this.hasReturn_ != hasReturns) {
        if (hasReturns) {
          this.setReturnAnnotation_(true);
          // Blockly.icons.MutatorIcon.reconnect(this.returnConnection_, this, 'RETURNS');
          this.returnConnection_ = null;
        } else {
          let returnConnection = this.getInput('RETURNS').connection
          this.returnConnection_ = returnConnection.targetConnection;
          if (this.returnConnection_) {
            let returnBlock = returnConnection.targetBlock();
            returnBlock.unplug();
            returnBlock.bumpNeighbours_();
          }
          this.setReturnAnnotation_(false);
        }
      }
    }
  },
  /**
   * Store pointers to any connected child blocks.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this Blockly.Block
   */
  saveConnections: function (containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    var i = 0;
    while (itemBlock) {
      var input = this.getInput('PARAMETER' + i);
      itemBlock.valueConnection_ = input && input.connection.targetConnection;
      i++;
      itemBlock = itemBlock.nextConnection &&
        itemBlock.nextConnection.targetBlock();
    }
  },
};

Blockly.Blocks['ast_FunctionHeaderMutator'] = {
  init: function () {
    this.jsonInit({
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
  }
};

[
  ['Parameter', 'Parameter', '', false, false],
  ['ParameterType', 'Parameter with type', '', true, false],
  ['ParameterDefault', 'Parameter with default value', '', false, true],
  ['ParameterDefaultType', 'Parameter with type and default value', '', true, true],
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

  // 定义 Mutant block
  Blockly.Blocks[`ast_FunctionMutant${parameterType}`] = {
    init: function () {
      this.jsonInit({
        "type": `ast_FunctionMutant${parameterType}`,
        "message0": parameterDescription,
        "previousStatement": null,
        "nextStatement": null,
        "colour": BlockMirrorTextToBlocks.COLOR.FUNCTIONS,
        "enableContextMenu": false
      });
    }
  };

  // 定义 real parameter block 并注册到 Blockly.Blocks 中
  Blockly.Blocks[`ast_Function${parameterType}`] = {
    init: function () {
      let realParameterBlock = {
        "type": `ast_Function${parameterType}`,
        "output": "Parameter",
        "message0": parameterPrefix + (parameterPrefix ? ' ' : '') + "%1",
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
      this.jsonInit(realParameterBlock);  // 使用 jsonInit 初始化 block
    }
  };

  // 将 real parameter block 添加到 BlockMirrorTextToBlocks.BLOCKS 数组
  BlockMirrorTextToBlocks.BLOCKS.push(Blockly.Blocks[`ast_Function${parameterType}`]);
});


Blockly.Blocks['ast_Starred'] = {
  init: function () {
    this.jsonInit({
      "type": 'ast_Starred',
      "message0": "*%1",
      "args0": [
        { "type": "input_value", "name": "VALUE" }
      ],
      "inputsInline": false,
      "output": null,
      "colour": BlockMirrorTextToBlocks.COLOR.VARIABLES
    });
  }
};

// ast_Global
Blockly.Blocks['ast_Global'] = {
  init: function () {
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BlockMirrorTextToBlocks.COLOR.VARIABLES);
    this.nameCount_ = 1;
    this.appendDummyInput('GLOBAL')
      .appendField("make global", "START_GLOBALS");
    this.updateShape_();
  },
  updateShape_: function () {
    let input = this.getInput("GLOBAL");
    // Update pluralization
    if (this.getField('START_GLOBALS')) {
      this.setFieldValue(this.nameCount_ > 1 ? "make globals" : "make global", "START_GLOBALS");
    }
    // Update fields
    for (var i = 0; i < this.nameCount_; i++) {
      if (!this.getField('NAME' + i)) {
        if (i !== 0) {
          input.appendField(',').setAlign(Blockly.inputs.Align.RIGHT);
        }
        input.appendField(new Blockly.FieldVariable("variable"), 'NAME' + i);
      }
    }
    // Remove deleted fields.
    while (this.getField('NAME' + i)) {
      input.removeField('NAME' + i);
      i++;
    }
    // Delete and re-add ending field
    if (this.getField("END_GLOBALS")) {
      input.removeField("END_GLOBALS");
    }
    input.appendField("available", "END_GLOBALS");
  },
  /**
   * Create XML to represent list inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    var container = document.createElement('mutation');
    container.setAttribute('names', this.nameCount_);
    return container;
  },
  /**
   * Parse XML to restore the list inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.nameCount_ = parseInt(xmlElement.getAttribute('names'), 10);
    this.updateShape_();
  },
};

// ast_If
Blockly.Blocks['ast_If'] = {
  init: function () {
    this.orelse_ = 0;
    this.elifs_ = 0;
    this.appendValueInput('TEST')
      .appendField("if");
    this.appendStatementInput("BODY")
      .setCheck(null)
      .setAlign(Blockly.inputs.Align.RIGHT);
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BlockMirrorTextToBlocks.COLOR.LOGIC);
    this.updateShape_();
  },
  // TODO: Not mutable currently
  updateShape_: function () {
    let latestInput = "BODY";
    for (var i = 0; i < this.elifs_; i++) {
      if (!this.getInput('ELIF' + i)) {
        this.appendValueInput('ELIFTEST' + i)
          .appendField('elif');
        this.appendStatementInput("ELIFBODY" + i)
          .setCheck(null);
      }
    }
    // Remove deleted inputs.
    while (this.getInput('ELIFTEST' + i)) {
      this.removeInput('ELIFTEST' + i);
      this.removeInput('ELIFBODY' + i);
      i++;
    }

    if (this.orelse_ && !this.getInput('ELSE')) {
      this.appendDummyInput('ORELSETEST')
        .appendField("else:");
      this.appendStatementInput("ORELSEBODY")
        .setCheck(null);
    } else if (!this.orelse_ && this.getInput('ELSE')) {
      this.removeInput('ORELSETEST');
      this.removeInput('ORELSEBODY');
    }

    for (i = 0; i < this.elifs_; i++) {
      if (this.orelse_) {
        this.moveInputBefore('ELIFTEST' + i, 'ORELSETEST');
        this.moveInputBefore('ELIFBODY' + i, 'ORELSETEST');
      } else if (i + 1 < this.elifs_) {
        this.moveInputBefore('ELIFTEST' + i, 'ELIFTEST' + (i + 1));
        this.moveInputBefore('ELIFBODY' + i, 'ELIFBODY' + (i + 1));
      }
    }
  },
  /**
   * Create XML to represent the (non-editable) name and arguments.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    let container = document.createElement('mutation');
    container.setAttribute('orelse', this.orelse_);
    container.setAttribute('elifs', this.elifs_);
    return container;
  },
  /**
   * Parse XML to restore the (non-editable) name and parameters.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.orelse_ = "true" === xmlElement.getAttribute('orelse');
    this.elifs_ = parseInt(xmlElement.getAttribute('elifs'), 10) || 0;
    this.updateShape_();
  },
};


// ast_IfExp
Blockly.Blocks['ast_IfExp'] = {
  init: function () {
    this.jsonInit({
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
  }
};

// ast_Import
// TODO: direct imports are not variables, because you can do stuff like:
//         import os.path
//       What should the variable be? Blockly will mangle it, but we should really be
//       doing something more complicated here with namespaces (probably make `os` the
//       variable and have some kind of list of attributes. But that's in the fading zone.
Blockly.Blocks['ast_Import'] = {
  init: function () {
    this.nameCount_ = 1;
    this.from_ = false;
    this.regulars_ = [true];
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BlockMirrorTextToBlocks.COLOR.PYTHON);
    this.updateShape_();
  },
  // TODO: Not mutable currently
  updateShape_: function () {
    // Possible FROM part
    if (this.from_ && !this.getInput('FROM')) {
      this.appendDummyInput('FROM')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('from')
        .appendField(new Blockly.FieldTextInput("module"), "MODULE");
    } else if (!this.from_ && this.getInput('FROM')) {
      this.removeInput('FROM');
    }
    // Import clauses
    for (var i = 0; i < this.nameCount_; i++) {
      let input = this.getInput('CLAUSE' + i);
      if (!input) {
        input = this.appendDummyInput('CLAUSE' + i)
          .setAlign(1);
        if (i === 0) {
          input.appendField("import");
        }
        input.appendField(new Blockly.FieldTextInput("default"), "NAME" + i)
      }
      if (this.regulars_[i] && this.getField('AS' + i)) {
        input.removeField('AS' + i);
        input.removeField('ASNAME' + i);
      } else if (!this.regulars_[i] && !this.getField('AS' + i)) {
        input.appendField("as", 'AS' + i)
          .appendField(new Blockly.FieldVariable("alias"), "ASNAME" + i);
      }
    }
    // Remove deleted inputs.
    while (this.getInput('CLAUSE' + i)) {
      this.removeInput('CLAUSE' + i);
      i++;
    }
    // Reposition everything
    if (this.from_ && this.nameCount_ > 0) {
      this.moveInputBefore('FROM', 'CLAUSE0');
    }
    for (i = 0; i + 1 < this.nameCount_; i++) {
      this.moveInputBefore('CLAUSE' + i, 'CLAUSE' + (i + 1));
    }
  },
  /**
   * Create XML to represent the (non-editable) name and arguments.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    let container = document.createElement('mutation');
    container.setAttribute('names', this.nameCount_);
    container.setAttribute('from', this.from_);
    for (let i = 0; i < this.nameCount_; i++) {
      let parameter = document.createElement('regular');
      parameter.setAttribute('name', this.regulars_[i]);
      container.appendChild(parameter);
    }
    return container;
  },
  /**
   * Parse XML to restore the (non-editable) name and parameters.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.nameCount_ = parseInt(xmlElement.getAttribute('names'), 10);
    this.from_ = "true" === xmlElement.getAttribute('from');
    this.regulars_ = [];
    for (let i = 0, childNode; childNode = xmlElement.childNodes[i]; i++) {
      if (childNode.nodeName.toLowerCase() === 'regular') {
        this.regulars_.push("true" === childNode.getAttribute('name'));
      }
    }
    this.updateShape_();
  },
};


// ast_Lambda
Blockly.Blocks['ast_Lambda'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("lambda")
      .setAlign(Blockly.inputs.Align.RIGHT);
    this.decoratorsCount_ = 0;
    this.parametersCount_ = 0;
    this.hasReturn_ = false;
    this.appendValueInput("BODY")
      .appendField("body")
      .setAlign(Blockly.inputs.Align.RIGHT)
      .setCheck(null);
    this.setInputsInline(false);
    this.setOutput(true);
    this.setColour(BlockMirrorTextToBlocks.COLOR.FUNCTIONS);
    this.updateShape_();
  },
  mutationToDom: Blockly.Blocks['ast_FunctionDef'].mutationToDom,
  domToMutation: Blockly.Blocks['ast_FunctionDef'].domToMutation,
  updateShape_: Blockly.Blocks['ast_FunctionDef'].updateShape_,
  setReturnAnnotation_: Blockly.Blocks['ast_FunctionDef'].setReturnAnnotation_,
};

// ast_List
Blockly.Blocks['ast_List'] = {
  /**
   * Block for creating a list with any number of elements of any type.
   * @this Blockly.Block
   */
  init: function () {
    this.setHelpUrl(Blockly.Msg['LISTS_CREATE_WITH_HELPURL']);
    this.setColour(BlockMirrorTextToBlocks.COLOR.LIST);
    this.itemCount_ = 3;
    this.updateShape_();
    this.setOutput(true, 'List');
    this.setMutator(new Blockly.icons.MutatorIcon(['ast_List_create_with_item'], this));
  },
  /**
   * Create XML to represent list inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    var container = document.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },
  /**
   * Parse XML to restore the list inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
    this.updateShape_();
  },
  /**
   * Populate the mutator's dialog with this block's components.
   * @param {!Blockly.Workspace} workspace Mutator's workspace.
   * @return {!Blockly.Block} Root block in mutator.
   * @this Blockly.Block
   */
  decompose: function (workspace) {
    var containerBlock = workspace.newBlock('ast_List_create_with_container');
    containerBlock.initSvg();
    var connection = containerBlock.getInput('STACK').connection;
    for (var i = 0; i < this.itemCount_; i++) {
      var itemBlock = workspace.newBlock('ast_List_create_with_item');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },
  /**
   * Reconfigure this block based on the mutator dialog's components.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this Blockly.Block
   */
  compose: function (containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    // Count number of inputs.
    var connections = [];
    while (itemBlock) {
      connections.push(itemBlock.valueConnection_);
      itemBlock = itemBlock.nextConnection &&
        itemBlock.nextConnection.targetBlock();
    }
    // Disconnect any children that don't belong.
    for (var i = 0; i < this.itemCount_; i++) {
      var connection = this.getInput('ADD' + i).connection.targetConnection;
      if (connection && connections.indexOf(connection) == -1) {
        connection.disconnect();
      }
    }
    this.itemCount_ = connections.length;
    this.updateShape_();
    // Reconnect any child blocks.
    // for (var i = 0; i < this.itemCount_; i++) {
    //     Blockly.icons.MutatorIcon.reconnect(connections[i], this, 'ADD' + i);
    // }
  },
  /**
   * Store pointers to any connected child blocks.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this Blockly.Block
   */
  saveConnections: function (containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    var i = 0;
    while (itemBlock) {
      var input = this.getInput('ADD' + i);
      itemBlock.valueConnection_ = input && input.connection.targetConnection;
      i++;
      itemBlock = itemBlock.nextConnection &&
        itemBlock.nextConnection.targetBlock();
    }
  },
  /**
   * Modify this block to have the correct number of inputs.
   * @private
   * @this Blockly.Block
   */
  updateShape_: function () {
    if (this.itemCount_ && this.getInput('EMPTY')) {
      this.removeInput('EMPTY');
    } else if (!this.itemCount_ && !this.getInput('EMPTY')) {
      this.appendDummyInput('EMPTY')
        .appendField('create empty list []');
    }
    // Add new inputs.
    for (var i = 0; i < this.itemCount_; i++) {
      if (!this.getInput('ADD' + i)) {
        var input = this.appendValueInput('ADD' + i);
        if (i == 0) {
          input.appendField('create list with [');
        } else {
          input.appendField(',').setAlign(Blockly.inputs.Align.RIGHT);
        }
      }
    }
    // Remove deleted inputs.
    while (this.getInput('ADD' + i)) {
      this.removeInput('ADD' + i);
      i++;
    }
    // Add the trailing "]"
    if (this.getInput('TAIL')) {
      this.removeInput('TAIL');
    }
    if (this.itemCount_) {
      this.appendDummyInput('TAIL')
        .appendField(']')
        .setAlign(Blockly.inputs.Align.RIGHT);
    }
  }
};


Blockly.Blocks['ast_List_create_with_container'] = {
  /**
   * Mutator block for list container.
   * @this Blockly.Block
   */
  init: function () {
    this.setColour(BlockMirrorTextToBlocks.COLOR.LIST);
    this.appendDummyInput()
      .appendField('Add new list elements below');
    this.appendStatementInput('STACK');
    this.contextMenu = false;
  }
};

Blockly.Blocks['ast_List_create_with_item'] = {
  /**
   * Mutator block for adding items.
   * @this Blockly.Block
   */
  init: function () {
    this.setColour(BlockMirrorTextToBlocks.COLOR.LIST);
    this.appendDummyInput()
      .appendField('Element');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
  }
};

// ast_Nonlocal
Blockly.Blocks['ast_Nonlocal'] = {
  init: function () {
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BlockMirrorTextToBlocks.COLOR.VARIABLES);
    this.nameCount_ = 1;
    this.appendDummyInput('NONLOCAL')
      .appendField("make nonlocal", "START_NONLOCALS");
    this.updateShape_();
  },
  updateShape_: function () {
    let input = this.getInput("NONLOCAL");
    // Update pluralization
    if (this.getField('START_NONLOCALS')) {
      this.setFieldValue(this.nameCount_ > 1 ? "make nonlocals" : "make nonlocal", "START_NONLOCALS");
    }
    // Update fields
    for (var i = 0; i < this.nameCount_; i++) {
      if (!this.getField('NAME' + i)) {
        if (i !== 0) {
          input.appendField(',').setAlign(Blockly.inputs.Align.RIGHT);
        }
        input.appendField(new Blockly.FieldVariable("variable"), 'NAME' + i);
      }
    }
    // Remove deleted fields.
    while (this.getField('NAME' + i)) {
      input.removeField('NAME' + i);
      i++;
    }
    // Delete and re-add ending field
    if (this.getField("END_NONLOCALS")) {
      input.removeField("END_NONLOCALS");
    }
    input.appendField("available", "END_NONLOCALS");
  },
  /**
   * Create XML to represent list inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    var container = document.createElement('mutation');
    container.setAttribute('names', this.nameCount_);
    return container;
  },
  /**
   * Parse XML to restore the list inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.nameCount_ = parseInt(xmlElement.getAttribute('names'), 10);
    this.updateShape_();
  },
};


// ast_Raise
Blockly.Blocks['ast_Raise'] = {
  init: function () {
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BlockMirrorTextToBlocks.COLOR.EXCEPTIONS);
    this.exc_ = true;
    this.cause_ = false;

    this.appendDummyInput()
      .appendField("raise");
    this.updateShape_();
  },
  updateShape_: function () {
    if (this.exc_ && !this.getInput('EXC')) {
      this.appendValueInput("EXC")
        .setCheck(null);
    } else if (!this.exc_ && this.getInput('EXC')) {
      this.removeInput('EXC');
    }
    if (this.cause_ && !this.getInput('CAUSE')) {
      this.appendValueInput("CAUSE")
        .setCheck(null)
        .appendField("from");
    } else if (!this.cause_ && this.getInput('CAUSE')) {
      this.removeInput('CAUSE');
    }
    if (this.cause_ && this.exc_) {
      this.moveInputBefore('EXC', 'CAUSE');
    }
  },
  /**
   * Create XML to represent list inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    var container = document.createElement('mutation');
    container.setAttribute('exc', this.exc_);
    container.setAttribute('cause', this.cause_);
    return container;
  },
  /**
   * Parse XML to restore the list inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.exc_ = "true" === xmlElement.getAttribute('exc');
    this.cause_ = "true" === xmlElement.getAttribute('cause');
    this.updateShape_();
  },
};


// ast_Set
Blockly.Blocks['ast_Set'] = {
  /**
   * Block for creating a set with any number of elements of any type.
   * @this Blockly.Block
   */
  init: function () {
    this.setColour(BlockMirrorTextToBlocks.COLOR.SET);
    this.itemCount_ = 3;
    this.updateShape_();
    this.setOutput(true, 'Set');
    this.setMutator(new Blockly.icons.MutatorIcon(['ast_Set_create_with_item'], this));
  },
  /**
   * Create XML to represent set inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    var container = document.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },
  /**
   * Parse XML to restore the set inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
    this.updateShape_();
  },
  /**
   * Populate the mutator's dialog with this block's components.
   * @param {!Blockly.Workspace} workspace Mutator's workspace.
   * @return {!Blockly.Block} Root block in mutator.
   * @this Blockly.Block
   */
  decompose: function (workspace) {
    var containerBlock = workspace.newBlock('ast_Set_create_with_container');
    containerBlock.initSvg();
    var connection = containerBlock.getInput('STACK').connection;
    for (var i = 0; i < this.itemCount_; i++) {
      var itemBlock = workspace.newBlock('ast_Set_create_with_item');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },
  /**
   * Reconfigure this block based on the mutator dialog's components.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this Blockly.Block
   */
  compose: function (containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    // Count number of inputs.
    var connections = [];
    while (itemBlock) {
      connections.push(itemBlock.valueConnection_);
      itemBlock = itemBlock.nextConnection &&
        itemBlock.nextConnection.targetBlock();
    }
    // Disconnect any children that don't belong.
    for (var i = 0; i < this.itemCount_; i++) {
      var connection = this.getInput('ADD' + i).connection.targetConnection;
      if (connection && connections.indexOf(connection) == -1) {
        connection.disconnect();
      }
    }
    this.itemCount_ = connections.length;
    this.updateShape_();
    // // Reconnect any child blocks.
    // for (var i = 0; i < this.itemCount_; i++) {
    //     Blockly.icons.MutatorIcon.reconnect(connections[i], this, 'ADD' + i);
    // }
  },
  /**
   * Store pointers to any connected child blocks.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this Blockly.Block
   */
  saveConnections: function (containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    var i = 0;
    while (itemBlock) {
      var input = this.getInput('ADD' + i);
      itemBlock.valueConnection_ = input && input.connection.targetConnection;
      i++;
      itemBlock = itemBlock.nextConnection &&
        itemBlock.nextConnection.targetBlock();
    }
  },
  /**
   * Modify this block to have the correct number of inputs.
   * @private
   * @this Blockly.Block
   */
  updateShape_: function () {
    if (this.itemCount_ && this.getInput('EMPTY')) {
      this.removeInput('EMPTY');
    } else if (!this.itemCount_ && !this.getInput('EMPTY')) {
      this.appendDummyInput('EMPTY')
        .appendField('create empty set');
    }
    // Add new inputs.
    for (var i = 0; i < this.itemCount_; i++) {
      if (!this.getInput('ADD' + i)) {
        var input = this.appendValueInput('ADD' + i);
        if (i === 0) {
          input.appendField('create set with {').setAlign(Blockly.inputs.Align.RIGHT);
        } else {
          input.appendField(',').setAlign(Blockly.inputs.Align.RIGHT);
        }
      }
    }
    // Remove deleted inputs.
    while (this.getInput('ADD' + i)) {
      this.removeInput('ADD' + i);
      i++;
    }
    // Add the trailing "]"
    if (this.getInput('TAIL')) {
      this.removeInput('TAIL');
    }
    if (this.itemCount_) {
      this.appendDummyInput('TAIL').appendField('}').setAlign(Blockly.inputs.Align.RIGHT);

    }
  }
};

Blockly.Blocks['ast_Set_create_with_container'] = {
  /**
   * Mutator block for set container.
   * @this Blockly.Block
   */
  init: function () {
    this.setColour(BlockMirrorTextToBlocks.COLOR.SET);
    this.appendDummyInput()
      .appendField('Add new set elements below');
    this.appendStatementInput('STACK');
    this.contextMenu = false;
  }
};

Blockly.Blocks['ast_Set_create_with_item'] = {
  /**
   * Mutator block for adding items.
   * @this Blockly.Block
   */
  init: function () {
    this.setColour(BlockMirrorTextToBlocks.COLOR.SET);
    this.appendDummyInput()
      .appendField('Element');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
  }
};


Blockly.Blocks['ast_Image'] = {
  init: function () {
    this.setColour(BlockMirrorTextToBlocks.COLOR.TEXT);
    this.src_ = "loading.png";
    this.updateShape_();
    this.setOutput(true);
  },
  mutationToDom: function () {
    var container = document.createElement('mutation');
    container.setAttribute('src', this.src_);
    return container;
  },
  domToMutation: function (xmlElement) {
    this.src_ = xmlElement.getAttribute('src');
    this.updateShape_();
  },
  updateShape_: function () {
    let image = this.getInput('IMAGE');
    if (!image) {
      image = this.appendDummyInput("IMAGE");
      image.appendField(new Blockly.FieldImage(this.src_, 40, 40, { alt: this.src_, flipRtl: "FALSE" }));
    }
    let imageField = image.fieldRow[0];
    imageField.setValue(this.src_);
  }
};


// ast_SubScript
Blockly.Blocks['ast_Subscript'] = {
  init: function () {
    this.setInputsInline(true);
    this.setOutput(true);
    this.setColour(BlockMirrorTextToBlocks.COLOR.SEQUENCES);
    this.sliceKinds_ = ["I"];

    this.appendValueInput("VALUE")
      .setCheck(null);
    this.appendDummyInput('OPEN_BRACKET')
      .appendField("[",);
    this.appendDummyInput('CLOSE_BRACKET')
      .appendField("]",);
    this.updateShape_();
  },
  setExistence: function (label, exist, isDummy) {
    if (exist && !this.getInput(label)) {
      if (isDummy) {
        return this.appendDummyInput(label);
      } else {
        return this.appendValueInput(label);
      }
    } else if (!exist && this.getInput(label)) {
      this.removeInput(label);
    }
    return null;
  },
  createSlice_: function (i, kind) {
    // ,
    let input = this.setExistence('COMMA' + i, i !== 0, true);
    if (input) {
      input.appendField(",")
    }
    // Single index
    let isIndex = (kind.charAt(0) === 'I');
    input = this.setExistence('INDEX' + i, isIndex, false);
    // First index
    input = this.setExistence('SLICELOWER' + i, !isIndex && "1" === kind.charAt(1), false);
    // First colon
    input = this.setExistence('SLICECOLON' + i, !isIndex, true);
    if (input) {
      input.appendField(':').setAlign(Blockly.inputs.Align.RIGHT);
    }
    // Second index
    input = this.setExistence('SLICEUPPER' + i, !isIndex && "1" === kind.charAt(2), false);
    // Second colon and third index
    input = this.setExistence('SLICESTEP' + i, !isIndex && "1" === kind.charAt(3), false);
    if (input) {
      input.appendField(':').setAlign(Blockly.inputs.Align.RIGHT);
    }
  },
  updateShape_: function () {
    // Add new inputs.
    for (var i = 0; i < this.sliceKinds_.length; i++) {
      this.createSlice_(i, this.sliceKinds_[i]);
    }

    for (let j = 0; j < i; j++) {
      if (j !== 0) {
        this.moveInputBefore('COMMA' + j, 'CLOSE_BRACKET');
      }
      let kind = this.sliceKinds_[j];
      if (kind.charAt(0) === "I") {
        this.moveInputBefore('INDEX' + j, 'CLOSE_BRACKET');
      } else {
        if (kind.charAt(1) === "1") {
          this.moveInputBefore("SLICELOWER" + j, 'CLOSE_BRACKET');
        }
        this.moveInputBefore("SLICECOLON" + j, 'CLOSE_BRACKET');
        if (kind.charAt(2) === "1") {
          this.moveInputBefore("SLICEUPPER" + j, 'CLOSE_BRACKET');
        }
        if (kind.charAt(3) === "1") {
          this.moveInputBefore("SLICESTEP" + j, 'CLOSE_BRACKET');
        }
      }
    }

    // Remove deleted inputs.
    while (this.getInput('TARGET' + i) || this.getInput('SLICECOLON')) {
      this.removeInput('COMMA' + i, true);
      if (this.getInput('INDEX' + i)) {
        this.removeInput('INDEX' + i);
      } else {
        this.removeInput('SLICELOWER' + i, true);
        this.removeInput('SLICECOLON' + i, true);
        this.removeInput('SLICEUPPER' + i, true);
        this.removeInput('SLICESTEP' + i, true);
      }
      i++;
    }
  },
  /**
   * Create XML to represent list inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    let container = document.createElement('mutation');
    for (let i = 0; i < this.sliceKinds_.length; i++) {
      let parameter = document.createElement('arg');
      parameter.setAttribute('name', this.sliceKinds_[i]);
      container.appendChild(parameter);
    }
    return container;
  },
  /**
   * Parse XML to restore the list inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.sliceKinds_ = [];
    for (let i = 0, childNode; childNode = xmlElement.childNodes[i]; i++) {
      if (childNode.nodeName.toLowerCase() === 'arg') {
        this.sliceKinds_.push(childNode.getAttribute('name'));
      }
    }
    this.updateShape_();
  },
};

Blockly.Blocks['ast_Try'] = {
  init: function () {
    this.handlersCount_ = 0;
    this.handlers_ = [];
    this.hasElse_ = false;
    this.hasFinally_ = false;
    this.appendDummyInput()
      .appendField("try:");
    this.appendStatementInput("BODY")
      .setCheck(null)
      .setAlign(Blockly.inputs.Align.RIGHT);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BlockMirrorTextToBlocks.COLOR.EXCEPTIONS);
    this.updateShape_();
  },
  // TODO: Not mutable currently
  updateShape_: function () {
    for (let i = 0; i < this.handlersCount_; i++) {
      if (this.handlers_[i] === BlockMirrorTextToBlocks.HANDLERS_CATCH_ALL) {
        this.appendDummyInput()
          .appendField('except');
      } else {
        this.appendValueInput("TYPE" + i)
          .setCheck(null)
          .appendField("except");
        if (this.handlers_[i] === BlockMirrorTextToBlocks.HANDLERS_COMPLETE) {
          this.appendDummyInput()
            .appendField("as")
            .appendField(new Blockly.FieldVariable("item"), "NAME" + i);
        }
      }
      this.appendStatementInput("HANDLER" + i)
        .setCheck(null);
    }
    if (this.hasElse_) {
      this.appendDummyInput()
        .appendField("else:");
      this.appendStatementInput("ORELSE")
        .setCheck(null);
    }
    if (this.hasFinally_) {
      this.appendDummyInput()
        .appendField("finally:");
      this.appendStatementInput("FINALBODY")
        .setCheck(null);
    }
  },
  /**
   * Create XML to represent the (non-editable) name and arguments.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    let container = document.createElement('mutation');
    container.setAttribute('orelse', this.hasElse_);
    container.setAttribute('finalbody', this.hasFinally_);
    container.setAttribute('handlers', this.handlersCount_);
    for (let i = 0; i < this.handlersCount_; i++) {
      let parameter = document.createElement('arg');
      parameter.setAttribute('name', this.handlers_[i]);
      container.appendChild(parameter);
    }
    return container;
  },
  /**
   * Parse XML to restore the (non-editable) name and parameters.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.hasElse_ = "true" === xmlElement.getAttribute('orelse');
    this.hasFinally_ = "true" === xmlElement.getAttribute('finalbody');
    this.handlersCount_ = parseInt(xmlElement.getAttribute('handlers'), 10);
    this.handlers_ = [];
    for (let i = 0, childNode; childNode = xmlElement.childNodes[i]; i++) {
      if (childNode.nodeName.toLowerCase() === 'arg') {
        this.handlers_.push(parseInt(childNode.getAttribute('name'), 10));
      }
    }
    this.updateShape_();
  },
};


// ast_Tuple
Blockly.Blocks['ast_Tuple'] = {
  /**
   * Block for creating a tuple with any number of elements of any type.
   * @this Blockly.Block
   */
  init: function () {
    this.setColour(BlockMirrorTextToBlocks.COLOR.TUPLE);
    this.itemCount_ = 3;
    this.updateShape_();
    this.setOutput(true, 'Tuple');
    this.setMutator(new Blockly.icons.MutatorIcon(['ast_Tuple_create_with_item'], this));
  },
  /**
   * Create XML to represent tuple inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    var container = document.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },
  /**
   * Parse XML to restore the tuple inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
    this.updateShape_();
  },
  /**
   * Populate the mutator's dialog with this block's components.
   * @param {!Blockly.Workspace} workspace Mutator's workspace.
   * @return {!Blockly.Block} Root block in mutator.
   * @this Blockly.Block
   */
  decompose: function (workspace) {
    var containerBlock = workspace.newBlock('ast_Tuple_create_with_container');
    containerBlock.initSvg();
    var connection = containerBlock.getInput('STACK').connection;
    for (var i = 0; i < this.itemCount_; i++) {
      var itemBlock = workspace.newBlock('ast_Tuple_create_with_item');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },
  /**
   * Reconfigure this block based on the mutator dialog's components.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this Blockly.Block
   */
  compose: function (containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    // Count number of inputs.
    var connections = [];
    while (itemBlock) {
      connections.push(itemBlock.valueConnection_);
      itemBlock = itemBlock.nextConnection &&
        itemBlock.nextConnection.targetBlock();
    }
    // Disconnect any children that don't belong.
    for (var i = 0; i < this.itemCount_; i++) {
      var connection = this.getInput('ADD' + i).connection.targetConnection;
      if (connection && connections.indexOf(connection) == -1) {
        connection.disconnect();
      }
    }
    this.itemCount_ = connections.length;
    this.updateShape_();
    // // Reconnect any child blocks.
    // for (var i = 0; i < this.itemCount_; i++) {
    //     connections[i].reconnect(this, 'ADD' + i);
    // }
  },
  /**
   * Store pointers to any connected child blocks.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this Blockly.Block
   */
  saveConnections: function (containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    var i = 0;
    while (itemBlock) {
      var input = this.getInput('ADD' + i);
      itemBlock.valueConnection_ = input && input.connection.targetConnection;
      i++;
      itemBlock = itemBlock.nextConnection &&
        itemBlock.nextConnection.targetBlock();
    }
  },
  /**
   * Modify this block to have the correct number of inputs.
   * @private
   * @this Blockly.Block
   */
  updateShape_: function () {
    if (this.itemCount_ && this.getInput('EMPTY')) {
      this.removeInput('EMPTY');
    } else if (!this.itemCount_ && !this.getInput('EMPTY')) {
      this.appendDummyInput('EMPTY')
        .appendField('()');
    }
    // Add new inputs.
    for (var i = 0; i < this.itemCount_; i++) {
      if (!this.getInput('ADD' + i)) {
        var input = this.appendValueInput('ADD' + i);
        if (i === 0) {
          input.appendField('(',).setAlign(Blockly.inputs.Align.RIGHT);
        } else {
          input.appendField(',').setAlign(Blockly.inputs.Align.RIGHT);
        }
      }
    }
    // Remove deleted inputs.
    while (this.getInput('ADD' + i)) {
      this.removeInput('ADD' + i);
      i++;
    }
    // Add the trailing "]"
    if (this.getInput('TAIL')) {
      this.removeInput('TAIL');
    }
    if (this.itemCount_) {
      let tail = this.appendDummyInput('TAIL');
      if (this.itemCount_ === 1) {
        tail.appendField(',)');
      } else {
        tail.appendField(')');
      }
      tail.setAlign(Blockly.inputs.Align.RIGHT);
    }
  }
};


// Blockly.Blocks['ast_Tuple_create_with_container'] = {
//     /**
//      * Mutator block for tuple container.
//      * @this Blockly.Block
//      */
//     init: function () {
//         this.setColour(BlockMirrorTextToBlocks.COLOR.TUPLE);
//         this.appendDummyInput()
//             .appendField('Add new tuple elements below');
//         this.appendStatementInput('STACK');
//         this.contextMenu = false;
//     }
// };

// Blockly.Extensions.register('ast_Tuple_create_with_container',
//     function () {
//         this.setColour(BlockMirrorTextToBlocks.COLOR.TUPLE);
//         this.appendDummyInput()
//             .appendField('Add new tuple elements below');
//         this.appendStatementInput('STACK');
//         this.contextMenu = false;
//     }
// )


// Blockly.Blocks['ast_Tuple_create_with_item'] = {
//     /**
//      * Mutator block for adding items.
//      * @this Blockly.Block
//      */
//     init: function () {
//         this.setColour(BlockMirrorTextToBlocks.COLOR.TUPLE);
//         this.appendDummyInput()
//             .appendField('Element');
//         this.setPreviousStatement(true);
//         this.setNextStatement(true);
//         this.contextMenu = false;
//     }
// };

// Blockly.Extensions.register('ast_Tuple_create_with_item',
//     function () {
//         this.setColour(BlockMirrorTextToBlocks.COLOR.TUPLE);
//         this.appendDummyInput()
//             .appendField('Element');
//         this.setPreviousStatement(true);
//         this.setNextStatement(true);
//         this.contextMenu = false;
//     }
// )


// ast_While
Blockly.Blocks['ast_While'] = {
  init: function () {
    this.orelse_ = 0;
    this.appendValueInput('TEST')
      .appendField("while");
    this.appendStatementInput("BODY")
      .setCheck(null)
      .setAlign(Blockly.inputs.Align.RIGHT);
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BlockMirrorTextToBlocks.COLOR.CONTROL);
    this.updateShape_();
  },
  // TODO: Not mutable currently
  updateShape_: function () {
    let latestInput = "BODY";

    if (this.orelse_ && !this.getInput('ELSE')) {
      this.appendDummyInput('ORELSETEST')
        .appendField("else:");
      this.appendStatementInput("ORELSEBODY")
        .setCheck(null);
    } else if (!this.orelse_ && this.getInput('ELSE')) {
      this.removeInput('ORELSETEST');
      this.removeInput('ORELSEBODY');
    }
  },
  /**
   * Create XML to represent the (non-editable) name and arguments.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    let container = document.createElement('mutation');
    container.setAttribute('orelse', this.orelse_);
    return container;
  },
  /**
   * Parse XML to restore the (non-editable) name and parameters.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.orelse_ = "true" === xmlElement.getAttribute('orelse');
    this.updateShape_();
  },
};


Blockly.Blocks['ast_With'] = {
  init: function () {
    this.appendValueInput('ITEM0')
      .appendField("with");
    this.appendStatementInput("BODY")
      .setCheck(null);
    this.itemCount_ = 1;
    this.renames_ = [false];
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BlockMirrorTextToBlocks.COLOR.CONTROL);
    this.updateShape_();
  },
  /**
   * Create XML to represent list inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    var container = document.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    for (let i = 0; i < this.itemCount_; i++) {
      let parameter = document.createElement('as');
      parameter.setAttribute('name', this.renames_[i]);
      container.appendChild(parameter);
    }
    return container;
  },
  /**
   * Parse XML to restore the list inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
    this.renames_ = [];
    for (let i = 0, childNode; childNode = xmlElement.childNodes[i]; i++) {
      if (childNode.nodeName.toLowerCase() === 'as') {
        this.renames_.push("true" === childNode.getAttribute('name'));
      }
    }
    this.updateShape_();
  },
  updateShape_: function () {
    // With clauses
    for (var i = 1; i < this.itemCount_; i++) {
      let input = this.getInput('ITEM' + i);
      if (!input) {
        input = this.appendValueInput('ITEM' + i);
      }
    }
    // Remove deleted inputs.
    while (this.getInput('ITEM' + i)) {
      this.removeInput('ITEM' + i);
      i++;
    }
    // Reposition everything
    for (i = 0; i < this.itemCount_; i++) {
      this.moveInputBefore('ITEM' + i, 'BODY');
    }
  },
};


// ast_Num
Blockly.Blocks['ast_Num'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_Num",
      "message0": "%1",
      "args0": [
        { "type": "field_number", "name": "NUM", "value": 0 }
      ],
      "output": "Number",
      "colour": BlockMirrorTextToBlocks.COLOR.MATH
    });
  }
};

// ast_Str
Blockly.Blocks['ast_Str'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_Str",
      "message0": "%1",
      "args0": [
        {
          "type": "field_input",
          "name": "TEXT",
          "text": '__'
        }
      ],
      "output": "String",
      "colour": BlockMirrorTextToBlocks.COLOR.TEXT, // 使用原有颜色
      "extensions": ["text_quotes"] // 添加引号扩展
    });
  }
};


// ast_NameConstantBoolean
Blockly.Blocks['ast_NameConstantBoolean'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_NameConstantBoolean",
      "message0": "%1", // 显示占位符，表示将使用字段
      "args0": [
        {
          "type": "field_dropdown",
          "name": "BOOL", // 字段名称，用于标识值
          "options": [
            ["True", "TRUE"],  // 下拉菜单选项
            ["False", "FALSE"]
          ]
        }
      ],
      "output": "Boolean",  // 方块输出类型为 Boolean
      "colour": BlockMirrorTextToBlocks.COLOR.LOGIC  // 设置颜色
    });
  }
};

// ast_Assert
Blockly.Blocks['ast_Assert'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_Assert",
      "message0": "assert %1",  // 显示 "assert" 语句，并占位符 %1
      "args0": [
        {
          "type": "input_value",  // 接受一个输入
          "name": "TEST"  // 名称为 TEST
        }
      ],
      "inputsInline": true,  // 将输入内容放在同一行
      "previousStatement": null,  // 可以连接到前面的语句
      "nextStatement": null,  // 可以连接到后面的语句
      "colour": BlockMirrorTextToBlocks.COLOR.LOGIC  // 设置颜色
    });
  }
};

// ast_AssertFull
Blockly.Blocks['ast_AssertFull'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_AssertFull",
      "message0": "assert %1 %2",  // 显示 "assert" 和两个占位符
      "args0": [
        {
          "type": "input_value",  // 接受一个输入
          "name": "TEST"  // 名称为 TEST
        },
        {
          "type": "input_value",  // 接受另一个输入
          "name": "MSG"  // 名称为 MSG
        }
      ],
      "inputsInline": true,  // 将输入内容放在同一行
      "previousStatement": null,  // 可以连接到前面的语句
      "nextStatement": null,  // 可以连接到后面的语句
      "colour": BlockMirrorTextToBlocks.COLOR.LOGIC  // 设置颜色
    });
  }
};


// ast_Attribute Block
Blockly.Blocks['ast_Attribute'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_Attribute",
      "message0": "%1 . %2",  // 显示对象与属性
      "args0": [
        {
          "type": "field_variable",  // 接受变量类型的字段
          "name": "VALUE",  // 变量名称
          "variable": "variable"  // 默认变量名称
        },
        {
          "type": "field_input",  // 接受字符串输入
          "name": "ATTR",  // 属性名称
          "text": "attribute"  // 默认属性名称
        }
      ],
      "inputsInline": true,  // 将输入内容放在同一行
      "output": null,  // 生成一个值输出
      "colour": BlockMirrorTextToBlocks.COLOR.OO  // 设置颜色
    });
  }
};


// ast_AttributeFull Block
Blockly.Blocks['ast_AttributeFull'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_AttributeFull",
      "message0": "%1 . %2",  // 显示对象与属性
      "lastDummyAlign0": "RIGHT",  // 右对齐
      "args0": [
        {
          "type": "input_value",  // 接受值类型的输入
          "name": "VALUE"  // 名称为 VALUE
        },
        {
          "type": "field_input",  // 接受字符串输入
          "name": "ATTR",  // 属性名称
          "text": "default"  // 默认属性名称
        }
      ],
      "inputsInline": true,  // 将输入内容放在同一行
      "output": null,  // 生成一个值输出
      "colour": BlockMirrorTextToBlocks.COLOR.OO  // 设置颜色
    });
  }
};


// ast_BinOp
var BINOPS_SIMPLE = ['Add', 'Sub', 'Mult', 'Div', 'Mod', 'Pow'];
var BINOPS_BLOCKLY_DISPLAY_FULL = BlockMirrorTextToBlocks.BINOPS.map(
  binop => [binop[0], binop[1]]
);
var BINOPS_BLOCKLY_DISPLAY = BINOPS_BLOCKLY_DISPLAY_FULL.filter(
  binop => BINOPS_SIMPLE.indexOf(binop[1]) >= 0
);

Blockly.Blocks['ast_BinOp'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_BinOp",
      "message0": "%1 %2 %3",  // 用来表示操作数和运算符
      "args0": [
        {
          "type": "input_value",  // 输入第一个操作数
          "name": "A"
        },
        {
          "type": "field_dropdown",  // 下拉菜单选择操作符
          "name": "OP",
          "options": BINOPS_BLOCKLY_DISPLAY  // 绑定操作符
        },
        {
          "type": "input_value",  // 输入第二个操作数
          "name": "B"
        }
      ],
      "inputsInline": true,  // 将所有输入放在一行
      "output": null,  // 该块输出一个值
      "colour": BlockMirrorTextToBlocks.COLOR.MATH  // 设置颜色
    });
  }
};

Blockly.Blocks['ast_BinOpFull'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_BinOpFull",
      "message0": "%1 %2 %3",  // 用来表示操作数和运算符
      "args0": [
        {
          "type": "input_value",  // 输入第一个操作数
          "name": "A"
        },
        {
          "type": "field_dropdown",  // 下拉菜单选择操作符
          "name": "OP",
          "options": BINOPS_BLOCKLY_DISPLAY_FULL  // 绑定所有可用操作符
        },
        {
          "type": "input_value",  // 输入第二个操作数
          "name": "B"
        }
      ],
      "inputsInline": true,  // 将所有输入放在一行
      "output": null,  // 该块输出一个值
      "colour": BlockMirrorTextToBlocks.COLOR.MATH  // 设置颜色
    });
  }
};

// ast_Break
Blockly.Blocks['ast_Break'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_Break",
      "message0": "break",  // 显示 "break" 关键字
      "inputsInline": false,  // 不需要输入
      "previousStatement": null,  // 表示这个块可以接在前一个语句后
      "nextStatement": null,  // 表示这个块后面可以跟其他语句
      "colour": BlockMirrorTextToBlocks.COLOR.CONTROL  // 控制块的颜色
    });
  }
};

// ast_Comment
Blockly.Blocks['ast_Comment'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_Comment",
      "message0": "# Comment: %1",  // 显示注释内容
      "args0": [
        {
          "type": "field_input",
          "name": "BODY",
          "text": "will be ignored"  // 默认文本
        }
      ],
      "inputsInline": true,  // 允许内联输入
      "previousStatement": null,  // 可以接在前一个语句后
      "nextStatement": null,  // 可以跟其他语句
      "colour": BlockMirrorTextToBlocks.COLOR.PYTHON  // 设置颜色
    });
  }
};


// ast_Compare
var COMPARES_BLOCKLY_DISPLAY = BlockMirrorTextToBlocks.COMPARES.map(
  boolop => [boolop[0], boolop[1]]
);
Blockly.Blocks['ast_Compare'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_Compare",
      "message0": "%1 %2 %3",  // 比较格式
      "args0": [
        { "type": "input_value", "name": "A" },  // 左侧输入
        {
          "type": "field_dropdown",
          "name": "OP",
          "options": COMPARES_BLOCKLY_DISPLAY  // 下拉菜单显示的操作符
        },
        { "type": "input_value", "name": "B" }  // 右侧输入
      ],
      "inputsInline": true,  // 允许内联输入
      "output": null,  // 此块没有输出类型
      "colour": BlockMirrorTextToBlocks.COLOR.LOGIC  // 设置颜色
    });
  }
};


// ast_Continue
Blockly.Blocks['ast_Continue'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_Continue",
      "message0": "continue",  // 显示内容
      "inputsInline": false,  // 不允许内联
      "previousStatement": null,  // 之前可以接其他语句
      "nextStatement": null,  // 可以接其他语句
      "colour": BlockMirrorTextToBlocks.COLOR.CONTROL  // 设置颜色
    });
  }
};


// ast_Expr
Blockly.Blocks['ast_Expr'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_Expr",
      "message0": "do nothing with %1",  // 显示内容
      "args0": [
        { "type": "input_value", "name": "VALUE" }  // 输入值
      ],
      "inputsInline": false,  // 不支持内联
      "previousStatement": null,  // 之前可以接其他语句
      "nextStatement": null,  // 可以接其他语句
      "colour": BlockMirrorTextToBlocks.COLOR.PYTHON  // 设置颜色
    });
  }
};


// ast_For
Blockly.Blocks['ast_For'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_For",
      "message0": "for each item %1 in list %2 : %3 %4",
      "args0": [
        { "type": "input_value", "name": "TARGET" },  // 目标变量
        { "type": "input_value", "name": "ITER" },   // 可迭代对象
        { "type": "input_dummy" },                    // 空输入
        { "type": "input_statement", "name": "BODY" } // 循环体
      ],
      "inputsInline": true,  // 允许内联输入
      "previousStatement": null,  // 之前可以接其他语句
      "nextStatement": null,  // 可以接其他语句
      "colour": BlockMirrorTextToBlocks.COLOR.CONTROL  // 控制块颜色
    });
  }
};


// ast_Name
Blockly.Blocks['ast_Name'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_Name",
      "message0": "%1",
      "args0": [
        { "type": "field_variable", "name": "VAR", "variable": "%{BKY_VARIABLES_DEFAULT_NAME}" }
      ],
      "output": null,
      "colour": BlockMirrorTextToBlocks.COLOR.VARIABLES,
      "extensions": ["contextMenu_variableSetterGetter_forBlockMirror"]
    });
  }
};


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
          callback: rename_option_callback_factory(this)
        };
        name = this.getField('VAR').getText();
        var deleteOption = {
          text: Blockly.Msg.DELETE_VARIABLE.replace('%1', name),
          enabled: true,
          callback: delete_option_callback_factory(this)
        };
        options.unshift(renameOption);
        options.unshift(deleteOption);
      }
    }
  }
};

const rename_option_callback_factory = function (block) {
  return function () {
    var workspace = block.workspace;
    var variable = block.getField('VAR').getVariable();
    Blockly.Variables.renameVariable(workspace, variable);
  };
};

/**
 * Callback for delete variable dropdown menu option associated with a
 * variable getter block.
 * @param {!Blockly.Block} block The block with the variable to delete.
 * @return {!function()} A function that deletes the variable.
 */
const delete_option_callback_factory = function (block) {
  return function () {
    var workspace = block.workspace;
    var variable = block.getField('VAR').getVariable();
    workspace.deleteVariableById(variable.getId());
    workspace.refreshToolboxSelection();
  };
};

if (!Blockly.Extensions.isRegistered('contextMenu_variableSetterGetter_forBlockMirror')){
  Blockly.Extensions.registerMixin('contextMenu_variableSetterGetter_forBlockMirror', CUSTOM_CONTEXT_MENU_VARIABLE_GETTER_SETTER_MIXIN_FOR_BLOCK_MIRROR);
}



// ast_Return
Blockly.Blocks['ast_Return'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_Return",
      "message0": "return",
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": BlockMirrorTextToBlocks.COLOR.FUNCTIONS,
    });
  }
};


Blockly.Blocks['ast_ReturnFull'] = {
  init: function () {
    this.jsonInit({
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
  }
};


// ast_Stared
Blockly.Blocks['ast_Starred'] = {
  init: function () {
    this.jsonInit({
      "type": 'ast_Starred',
      "message0": "*%1",
      "args0": [
        { "type": "input_value", "name": "VALUE" }
      ],
      "inputsInline": false,
      "output": null,
      "colour": BlockMirrorTextToBlocks.COLOR.VARIABLES
    });
  }
};


// print_Call
Blockly.Blocks['print_call'] = {
  init: function () {
    this.appendValueInput("ARG0")
      .setCheck(null)
      .appendField("print");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip('Prints a value.');
    this.setHelpUrl('');
  }
};



// ast_UnaryOp

BlockMirrorTextToBlocks.UNARYOPS = [
  ["+", "UAdd", 'Do nothing to the number'],
  ["-", "USub", 'Make the number negative'],
  ["not", "Not", 'Return the logical opposite of the value.'],
  ["~", "Invert", 'Take the bit inversion of the number']
];

// 遍歷每個 UnaryOp 操作符，創建對應的塊
BlockMirrorTextToBlocks.UNARYOPS.forEach(function (unaryop) {
  let fullName = "ast_UnaryOp" + unaryop[1];

  Blockly.Blocks[fullName] = {
    init: function () {
      this.appendValueInput("VALUE") // 添加一个输入
        .setCheck(null)
        .appendField(unaryop[0]); // 设置操作符符号
      this.setInputsInline(false); // 设置为非内联
      this.setOutput(true, null); // 设置为输出块
      this.setColour(unaryop[1] === 'Not' ? BlockMirrorTextToBlocks.COLOR.LOGIC : BlockMirrorTextToBlocks.COLOR.MATH); // 设置颜色
      this.setTooltip(unaryop[2]); // 设置提示信息
    }
  };
});


for (const [funcName, funcInfo] of Object.entries(BlockMirrorTextToBlocks.prototype.FUNCTION_SIGNATURES)) {
  Blockly.Blocks[`ast_${funcName}`] = {
    init: function () {
      // 添加函数名到块的字段中
      this.appendDummyInput()
        .appendField(funcName)  // 在方块上显示函数名

      // 检查 full 或 simple 参数并为每个参数添加输入
      const params = funcInfo.full || funcInfo.simple || [];
      if (params.length === 1) {
        this.appendValueInput(`ARG0`);
        this.setInputsInline(true);
      } else {
        params.forEach((param, index) => {
          this.appendValueInput(`ARG${index}`)
            .setCheck(null)  // 你可以根据需要替换为具体类型
            .appendField(param)  // 添加参数作为输入的字段
            .setAlign(Blockly.inputs.Align.RIGHT);
        });
      }
      // 设置块是否返回值
      if (funcInfo.returns) {
        this.setOutput(true, null);  // 返回值的块
      } else {
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);  // 无返回值的块
      }

      // 设置块的颜色
      this.setColour(funcInfo.colour || 180);

      // 提示信息
      this.setTooltip(`${funcName} 函式`);
    }
  };
}


Blockly.Variables.flyoutCategoryBlocks = function (workspace) {
  var variableModelList = workspace.getVariablesOfType('');
  var xmlList = [];

  if (variableModelList.length > 0) {
    // New variables are added to the end of the variableModelList.
    var mostRecentVariableFieldXmlString = variableModelList[variableModelList.length - 1];

    if (!Blockly.Variables._HIDE_GETTERS_SETTERS && Blockly.Blocks['ast_Assign']) {
      var gap = Blockly.Blocks['ast_AugAssign'] ? 8 : 24;
      var blockText = '<xml>' + '<block type="ast_Assign" gap="' + gap + '">' + mostRecentVariableFieldXmlString + '</block>' + '</xml>';
      var block = Blockly.Xml.textToDom(blockText).firstChild;
      xmlList.push(block);
    }

    if (!Blockly.Variables._HIDE_GETTERS_SETTERS && Blockly.Blocks['ast_AugAssign']) {
      var gap = Blockly.Blocks['ast_Name'] ? 20 : 8;
      var blockText = '<xml>' + '<block type="ast_Num" gap="' + gap + '">' + mostRecentVariableFieldXmlString + '<value name="VALUE">' + '<shadow type="ast_Num">' + '<field name="NUM">1</field>' + '</shadow>' + '</value>' + '<mutation options="false" simple="true"></mutation>' + '</block>' + '</xml>';
      var block = Blockly.Xml.textToDom(blockText).firstChild;
      xmlList.push(block);
    }

    if (Blockly.Blocks['ast_Name']) {
      variableModelList.sort(Blockly.VariableModel.compareByName);

      for (var i = 0, variable; variable = variableModelList[i]; i++) {
        if (!Blockly.Variables._HIDE_GETTERS_SETTERS) {
          var _block = Blockly.utils.xml.createElement('block');

          _block.setAttribute('type', 'ast_Name');

          _block.setAttribute('gap', 8);

          _block.appendChild(Blockly.Variables.generateVariableFieldDom(variable));

          xmlList.push(_block);
        } else {
          block = Blockly.utils.xml.createElement('label');
          block.setAttribute('text', variable.name);
          block.setAttribute('web-class', 'blockmirror-toolbox-variable'); //block.setAttribute('gap', 8);

          xmlList.push(block);
        }
      }
    }
  }

  return xmlList;
};


Blockly.VariableModel.compareByName = function (var1, var2) {
  var name1 = var1.name;
  var name2 = var2.name;

  if (name1 < name2) {
    return -1;
  } else if (name1 === name2) {
    return 0;
  } else {
    return 1;
  }
};

Blockly.Names.prototype.getName = function (name, type) {
  if (type == Blockly.VARIABLE_CATEGORY_NAME) {
    var varName = this.getNameForUserVariable_(name);

    if (varName) {
      name = varName;
    }
  }

  var normalized = name + '_' + type;
  var isVarType = type == Blockly.VARIABLE_CATEGORY_NAME || type == Blockly.Names.DEVELOPER_VARIABLE_TYPE;
  var prefix = isVarType ? this.variablePrefix_ : '';

  if (normalized in this.db_) {
    return prefix + this.db_[normalized];
  }

  var safeName = this.getDistinctName(name, type);
  this.db_[normalized] = safeName.substr(prefix.length);
  return safeName;
};

Blockly.Names.equals = function (name1, name2) {
  return name1 == name2;
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


// ast_Raw
Blockly.Blocks['ast_Raw'] = {
  init: function () {
    this.jsonInit({
      "type": "ast_Raw",
      "message0": "Code Block: %1 %2",
      "args0": [{
        "type": "input_dummy"
      }, {
        "type": "field_multilinetext",
        "name": "TEXT",
        "value": ''
      }],
      "colour": BlockMirrorTextToBlocks.COLOR.PYTHON,
      "previousStatement": null,
      "nextStatement": null
    });
  }
};