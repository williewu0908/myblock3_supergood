import React from 'react';
import BlocklyComponent from '@/components/blockly/BlocklyComponent';

export default BlocklyComponent;

const Block = (p) => {
  const {children, ...props} = p;
  props.is = 'blockly';
  return React.createElement('block', props, children);
};

const Button = (p) => {
  const {children, ...props} = p;
  props.is = 'blockly';
  return React.createElement('button', props, children);
};

const Category = (p) => {
  const {children, ...props} = p;
  props.is = 'blockly';
  return React.createElement('category', props, children);
};

const Value = (p) => {
  const {children, ...props} = p;
  props.is = 'blockly';
  return React.createElement('value', props, children);
};

const Field = (p) => {
  const {children, ...props} = p;
  props.is = 'blockly';
  return React.createElement('field', props, children);
};

const Shadow = (p) => {
  const {children, ...props} = p;
  props.is = 'blockly';
  return React.createElement('shadow', props, children);
};

const COLOR = {
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

export {Block, Button, Category, Value, Field, Shadow, COLOR};
