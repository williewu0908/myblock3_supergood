import pyflowchart

def code_to_flowchart(code):
    fc = pyflowchart.Flowchart.from_code(code)
    return fc.flowchart()


python_code = """
x = 123
"""

flowchart_text = code_to_flowchart(python_code)
print(flowchart_text)
