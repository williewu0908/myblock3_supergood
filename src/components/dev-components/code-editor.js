import React, { useState, useRef } from 'react';
import { Box } from '@mui/material';
import BlocklyComponent from "../blockly/BlocklyComponent";
import PythonEditor from '../pythonEditor/pythonEditor';
import PythonFlowchart from '../flowchart/pythonFlowchart';
import { CodeProvider } from './CodeContext';
import styles from './CodeEditor.module.css';

const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Logic',
      categorystyle: 'logic_category',
      contents: [
        {
          kind: 'block',
          type: 'controls_if',
        },
        {
          kind: 'block',
          type: 'logic_compare',
        },
        {
          kind: 'block',
          type: 'logic_operation',
        },
        {
          kind: 'block',
          type: 'logic_negate',
        },
        {
          kind: 'block',
          type: 'logic_boolean',
        },
        {
          kind: 'block',
          type: 'logic_null',
        },
        {
          kind: 'block',
          type: 'logic_ternary',
        },
      ],
    },
    {
      kind: 'category',
      name: 'Loops',
      categorystyle: 'loop_category',
      contents: [
        {
          kind: 'block',
          type: 'controls_repeat_ext',
          inputs: {
            TIMES: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 10,
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'controls_whileUntil',
        },
        {
          kind: 'block',
          type: 'controls_for',
          inputs: {
            FROM: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 1,
                },
              },
            },
            TO: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 10,
                },
              },
            },
            BY: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 1,
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'controls_forEach',
        },
        {
          kind: 'block',
          type: 'controls_flow_statements',
        },
      ],
    },
    {
      kind: 'category',
      name: 'Math',
      categorystyle: 'math_category',
      contents: [
        {
          kind: 'block',
          type: 'math_number',
          fields: {
            NUM: 123,
          },
        },
        {
          kind: 'block',
          type: 'math_arithmetic',
          inputs: {
            A: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 1,
                },
              },
            },
            B: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 1,
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'math_single',
          inputs: {
            NUM: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 9,
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'math_trig',
          inputs: {
            NUM: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 45,
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'math_constant',
        },
        {
          kind: 'block',
          type: 'math_number_property',
          inputs: {
            NUMBER_TO_CHECK: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 0,
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'math_round',
          fields: {
            OP: 'ROUND',
          },
          inputs: {
            NUM: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 3.1,
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'math_on_list',
          fields: {
            OP: 'SUM',
          },
        },
        {
          kind: 'block',
          type: 'math_modulo',
          inputs: {
            DIVIDEND: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 64,
                },
              },
            },
            DIVISOR: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 10,
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'math_constrain',
          inputs: {
            VALUE: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 50,
                },
              },
            },
            LOW: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 1,
                },
              },
            },
            HIGH: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 100,
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'math_random_int',
          inputs: {
            FROM: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 1,
                },
              },
            },
            TO: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 100,
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'math_random_float',
        },
        {
          kind: 'block',
          type: 'math_atan2',
          inputs: {
            X: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 1,
                },
              },
            },
            Y: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 1,
                },
              },
            },
          },
        },
      ],
    },
    {
      kind: 'category',
      name: 'Text',
      categorystyle: 'text_category',
      contents: [
        {
          kind: 'block',
          type: 'text',
        },
        {
          kind: 'block',
          type: 'text_join',
        },
        {
          kind: 'block',
          type: 'text_append',
          inputs: {
            TEXT: {
              shadow: {
                type: 'text',
                fields: {
                  TEXT: '',
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'text_length',
          inputs: {
            VALUE: {
              shadow: {
                type: 'text',
                fields: {
                  TEXT: 'abc',
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'text_isEmpty',
          inputs: {
            VALUE: {
              shadow: {
                type: 'text',
                fields: {
                  TEXT: '',
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'text_indexOf',
          inputs: {
            VALUE: {
              block: {
                type: 'variables_get',
              },
            },
            FIND: {
              shadow: {
                type: 'text',
                fields: {
                  TEXT: 'abc',
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'text_charAt',
          inputs: {
            VALUE: {
              block: {
                type: 'variables_get',
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'text_getSubstring',
          inputs: {
            STRING: {
              block: {
                type: 'variables_get',
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'text_changeCase',
          inputs: {
            TEXT: {
              shadow: {
                type: 'text',
                fields: {
                  TEXT: 'abc',
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'text_trim',
          inputs: {
            TEXT: {
              shadow: {
                type: 'text',
                fields: {
                  TEXT: 'abc',
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'text_count',
          inputs: {
            SUB: {
              shadow: {
                type: 'text',
              },
            },
            TEXT: {
              shadow: {
                type: 'text',
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'text_replace',
          inputs: {
            FROM: {
              shadow: {
                type: 'text',
              },
            },
            TO: {
              shadow: {
                type: 'text',
              },
            },
            TEXT: {
              shadow: {
                type: 'text',
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'text_reverse',
          inputs: {
            TEXT: {
              shadow: {
                type: 'text',
              },
            },
          },
        },
      ],
    },
    {
      kind: 'category',
      name: 'Lists',
      categorystyle: 'list_category',
      contents: [
        {
          kind: 'block',
          type: 'lists_create_with',
        },
        {
          kind: 'block',
          type: 'lists_create_with',
        },
        {
          kind: 'block',
          type: 'lists_repeat',
          inputs: {
            NUM: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 5,
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'lists_length',
        },
        {
          kind: 'block',
          type: 'lists_isEmpty',
        },
        {
          kind: 'block',
          type: 'lists_indexOf',
          inputs: {
            VALUE: {
              block: {
                type: 'variables_get',
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'lists_getIndex',
          inputs: {
            VALUE: {
              block: {
                type: 'variables_get',
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'lists_setIndex',
          inputs: {
            LIST: {
              block: {
                type: 'variables_get',
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'lists_getSublist',
          inputs: {
            LIST: {
              block: {
                type: 'variables_get',
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'lists_split',
          inputs: {
            DELIM: {
              shadow: {
                type: 'text',
                fields: {
                  TEXT: ',',
                },
              },
            },
          },
        },
        {
          kind: 'block',
          type: 'lists_sort',
        },
        {
          kind: 'block',
          type: 'lists_reverse',
        },
      ],
    },
    {
      kind: 'sep',
    },
    {
      kind: 'category',
      name: 'Variables',
      categorystyle: 'variable_category',
      custom: 'VARIABLE',
    },
    {
      kind: 'category',
      name: 'Functions',
      categorystyle: 'procedure_category',
      custom: 'PROCEDURE',
    },
  ],
};

export default function CodeEditor({ viewState }) {
  const BlocklyRef = useRef();
  const [code, setCode] = useState(`def add_numbers(num1, num2):
    result = num1 + num2
    return result

number1 = 5
number2 = 3
sum_result = add_numbers(number1, number2)
print("The sum of", number1, "and", number2, "is", sum_result)`);

  const handleCodeUpdate = (newCode) => {
    setCode(newCode);
  };

  const handleBlocklyCode = () =>{
    if (BlocklyRef.current) {
      BlocklyRef.current.pythonCode(); // 調用子組件的方法
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', borderRadius: '.3rem .3rem .0rem .0rem' }}>
      <CodeProvider>
        <Box sx={{ flex: 1, height: '100%', backgroundColor: '#F8F8F8', display: viewState.Blockly ? 'block' : 'none' }}>
          <div className={styles.boxtitle}>
            <h2>積木</h2>
            <button onClick={() => {
              handleBlocklyCode();
            }}>
              Update Code
            </button>
          </div>
          <div className={styles.boxcontainer} id='blockly_container'>
            <BlocklyComponent
              readOnly={false}
              trashcan={true}
              media={'media/'}
              move={{
                scrollbars: true,
                drag: true,
                wheel: true,
              }}
              grid={{
                spacing: 20,
                length: 3,
                colour: '#ccc',
                snap: true
              }}
              zoom={{
                controls: true,
                wheel: true,
                startScale: 1.0,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2
              }}
              toolbox={toolbox} // 這裡傳遞 toolbox
              ref={BlocklyRef}
              viewState={viewState.Blockly}
            />
          </div>
        </Box>

        <Box sx={{ flex: 1, height: '100%', backgroundColor: '#F8F8F8', display: viewState.FlowChart ? 'block' : 'none' }}>
          <div className={styles.boxtitle}>
            <h2>活動圖</h2>
            <button onClick={() => {
                window.dispatchEvent(new CustomEvent('exportFlowchart'));
              }}>
                Export Flowchart
            </button>
          </div>
          <div className={styles.boxcontainer}>
            <PythonFlowchart code={code} />
          </div>
        </Box>

        <Box sx={{ flex: 1, height: '100%', backgroundColor: '#F8F8F8', display: viewState.Code ? 'block' : 'none' }}>
          <div className={styles.boxtitle}>
            <h2>程式碼</h2>
          </div>
          <div className={styles.boxcontainer}>
            <PythonEditor code={code} onUpdate={handleCodeUpdate} />
          </div>
        </Box>
      </CodeProvider>
    </Box>
  );
}
