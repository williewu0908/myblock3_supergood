import Head from 'next/head'
import Script from 'next/script';
import styles from './blockly.module.css';
import blockly_compressed from 'blockly/blockly_compressed';
import blocks_compressed from 'blockly/blocks_compressed';
import javascript_compressed from 'blockly/javascript_compressed';
import python_compressed from 'blockly/python_compressed';
// import './script.js';

if (typeof window !== "undefined") {
  window.Blockly = blockly_compressed;
  window.blocks = blocks_compressed;
  window.javascript = javascript_compressed;
  window.python = python_compressed;
}


function BlocklyToolBox() {
  return (
    <xml
      xmlns="https://developers.google.com/blockly/xml"
      id="toolbox"
      style={{ display: "none" }}
    >
      <category name="%{BKY_CATLOGIC}" colour="%{BKY_LOGIC_HUE}">
        <block type="controls_if" />
        <block type="logic_compare" />
        <block type="logic_operation" />
        <block type="logic_negate" />
        <block type="logic_boolean" />
        <block type="logic_null" />
        <block type="logic_ternary" />
      </category>
      <category name="%{BKY_CATLOOPS}" colour="%{BKY_LOOPS_HUE}">
        <block type="controls_repeat_ext">
          <value name="TIMES">
            <shadow type="math_number">
              <field name="NUM">10</field>
            </shadow>
          </value>
        </block>
        <block type="controls_whileUntil" />
        <block type="controls_for">
          <value name="FROM">
            <shadow type="math_number">
              <field name="NUM">1</field>
            </shadow>
          </value>
          <value name="TO">
            <shadow type="math_number">
              <field name="NUM">10</field>
            </shadow>
          </value>
          <value name="BY">
            <shadow type="math_number">
              <field name="NUM">1</field>
            </shadow>
          </value>
        </block>
        <block type="controls_forEach" />
        <block type="controls_flow_statements" />
      </category>
      <category name="%{BKY_CATMATH}" colour="%{BKY_MATH_HUE}">
        <block type="math_number">
          <field name="NUM">123</field>
        </block>
        <block type="math_arithmetic">
          <value name="A">
            <shadow type="math_number">
              <field name="NUM">1</field>
            </shadow>
          </value>
          <value name="B">
            <shadow type="math_number">
              <field name="NUM">1</field>
            </shadow>
          </value>
        </block>
        <block type="math_single">
          <value name="NUM">
            <shadow type="math_number">
              <field name="NUM">9</field>
            </shadow>
          </value>
        </block>
        <block type="math_trig">
          <value name="NUM">
            <shadow type="math_number">
              <field name="NUM">45</field>
            </shadow>
          </value>
        </block>
        <block type="math_constant" />
        <block type="math_number_property">
          <value name="NUMBER_TO_CHECK">
            <shadow type="math_number">
              <field name="NUM">0</field>
            </shadow>
          </value>
        </block>
        <block type="math_round">
          <value name="NUM">
            <shadow type="math_number">
              <field name="NUM">3.1</field>
            </shadow>
          </value>
        </block>
        <block type="math_on_list" />
        <block type="math_modulo">
          <value name="DIVIDEND">
            <shadow type="math_number">
              <field name="NUM">64</field>
            </shadow>
          </value>
          <value name="DIVISOR">
            <shadow type="math_number">
              <field name="NUM">10</field>
            </shadow>
          </value>
        </block>
        <block type="math_constrain">
          <value name="VALUE">
            <shadow type="math_number">
              <field name="NUM">50</field>
            </shadow>
          </value>
          <value name="LOW">
            <shadow type="math_number">
              <field name="NUM">1</field>
            </shadow>
          </value>
          <value name="HIGH">
            <shadow type="math_number">
              <field name="NUM">100</field>
            </shadow>
          </value>
        </block>
        <block type="math_random_int">
          <value name="FROM">
            <shadow type="math_number">
              <field name="NUM">1</field>
            </shadow>
          </value>
          <value name="TO">
            <shadow type="math_number">
              <field name="NUM">100</field>
            </shadow>
          </value>
        </block>
        <block type="math_random_float" />
        <block type="math_atan2">
          <value name="X">
            <shadow type="math_number">
              <field name="NUM">1</field>
            </shadow>
          </value>
          <value name="Y">
            <shadow type="math_number">
              <field name="NUM">1</field>
            </shadow>
          </value>
        </block>
      </category>
      <category name="%{BKY_CATTEXT}" colour="%{BKY_TEXTS_HUE}">
        <block type="text" />
        <block type="text_join" />
        <block type="text_append">
          <value name="TEXT">
            <shadow type="text" />
          </value>
        </block>
        <block type="text_length">
          <value name="VALUE">
            <shadow type="text">
              <field name="TEXT">abc</field>
            </shadow>
          </value>
        </block>
        <block type="text_isEmpty">
          <value name="VALUE">
            <shadow type="text">
              <field name="TEXT" />
            </shadow>
          </value>
        </block>
        <block type="text_indexOf">
          <value name="VALUE">
            <block type="variables_get">
              <field name="VAR">
                {"{"}textVariable{"}"}
              </field>
            </block>
          </value>
          <value name="FIND">
            <shadow type="text">
              <field name="TEXT">abc</field>
            </shadow>
          </value>
        </block>
        <block type="text_charAt">
          <value name="VALUE">
            <block type="variables_get">
              <field name="VAR">
                {"{"}textVariable{"}"}
              </field>
            </block>
          </value>
        </block>
        <block type="text_getSubstring">
          <value name="STRING">
            <block type="variables_get">
              <field name="VAR">
                {"{"}textVariable{"}"}
              </field>
            </block>
          </value>
        </block>
        <block type="text_changeCase">
          <value name="TEXT">
            <shadow type="text">
              <field name="TEXT">abc</field>
            </shadow>
          </value>
        </block>
        <block type="text_trim">
          <value name="TEXT">
            <shadow type="text">
              <field name="TEXT">abc</field>
            </shadow>
          </value>
        </block>
        <block type="text_print">
          <value name="TEXT">
            <shadow type="text">
              <field name="TEXT">abc</field>
            </shadow>
          </value>
        </block>
        <block type="text_prompt_ext">
          <value name="TEXT">
            <shadow type="text">
              <field name="TEXT">abc</field>
            </shadow>
          </value>
        </block>
      </category>
      <category name="%{BKY_CATLISTS}" colour="%{BKY_LISTS_HUE}">
        <block type="lists_create_with">
          <mutation items={0} />
        </block>
        <block type="lists_create_with" />
        <block type="lists_repeat">
          <value name="NUM">
            <shadow type="math_number">
              <field name="NUM">5</field>
            </shadow>
          </value>
        </block>
        <block type="lists_length" />
        <block type="lists_isEmpty" />
        <block type="lists_indexOf">
          <value name="VALUE">
            <block type="variables_get">
              <field name="VAR">
                {"{"}listVariable{"}"}
              </field>
            </block>
          </value>
        </block>
        <block type="lists_getIndex">
          <value name="VALUE">
            <block type="variables_get">
              <field name="VAR">
                {"{"}listVariable{"}"}
              </field>
            </block>
          </value>
        </block>
        <block type="lists_setIndex">
          <value name="LIST">
            <block type="variables_get">
              <field name="VAR">
                {"{"}listVariable{"}"}
              </field>
            </block>
          </value>
        </block>
        <block type="lists_getSublist">
          <value name="LIST">
            <block type="variables_get">
              <field name="VAR">
                {"{"}listVariable{"}"}
              </field>
            </block>
          </value>
        </block>
        <block type="lists_split">
          <value name="DELIM">
            <shadow type="text">
              <field name="TEXT">,</field>
            </shadow>
          </value>
        </block>
        <block type="lists_sort" />
      </category>
      <sep />
      <category
        name="%{BKY_CATVARIABLES}"
        colour="%{BKY_VARIABLES_HUE}"
        custom="VARIABLE"
      />
      <category
        name="%{BKY_CATFUNCTIONS}"
        colour="%{BKY_PROCEDURES_HUE}"
        custom="PROCEDURE"
      />
    </xml>
  )
}

function Tabs() {
  return (
    <div className={styles.tabButtons} style={{display:'none'}}>
      <button id="tab_blocks" className={styles.tabon + ' ' + styles.tabButton}>積木</button>
      <button id="tab_javascript" className={styles.taboff + ' ' + styles.tabButton}>javascript</button>
      <button id="tab_python" className={styles.taboff + ' ' + styles.tabButton}>Python</button>
      <button id="tab_xml" className={styles.taboff + ' ' + styles.tabButton}>XML</button>
      <button id="tab_json" className={styles.taboff + ' ' + styles.tabButton}>JSON</button>
      <div id="tab_code" className={styles.tabCode}>
        <select id="code_menu" />
      </div>
      <div>
        <button id="trashButton" className={styles.notext} title="...">
          <img src="blockly/media/1x1.gif" className={styles.trash + ' ' + styles.icon21} />
        </button>
        <button id="linkButton" className={styles.notext} title="...">
          <img src="blockly/media/1x1.gif" className={styles.link + ' ' + styles.icon21} />
        </button>
        <button id="runButton" className={styles.notext + ' ' + styles.primary} title="...">
          <img src="blockly/media/1x1.gif" className={styles.run + ' ' + styles.icon21} />
        </button>
      </div>
    </div>
  )
}

function Content() {
  return (
    <div className={styles.contentContainer}>
      <div id="content_blocks" className={styles.content} />
      <pre id="content_javascript" className={styles.content + ' prettyprint lang-js'} />
      <pre id="content_python" className={styles.content + ' prettyprint lang-py'} />
      <pre id="content_php" className={styles.content + ' prettyprint lang-php'} />
      <pre id="content_lua" className={styles.content + ' prettyprint lang-lua'} />
      <pre id="content_dart" className={styles.content + ' prettyprint lang-dart'} />
      <textarea id="content_xml" className={styles.content} wrap="off" defaultValue={""} />
      <textarea id="content_json" className={styles.content} wrap="off" defaultValue={""} />
    </div>
  )
}

function Header() {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="google" value="notranslate" />
        <title>Blockly Demo:</title>
      </Head>

      <Script
        src="/blockly/src/blocklyScript.js"
        strategy="lazyOnload"
        onLoad={() =>
          console.log(`JavaScript正確地載入，blocklyScript.js 已被定義`)
        }
        defer
      />
    </>
  )
}

export default function HomePage() {
  return (
    <div id='blockly_block' width="99%" height="100%">
      <Header />
      <select id="languageMenu" />
      <Tabs />
      <div width="99%" height="99%" id="content_area"></div>
      <Content />
      <BlocklyToolBox />
    </div>
  );
}
