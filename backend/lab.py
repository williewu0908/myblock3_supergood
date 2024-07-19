import pyflowchart

def code_to_flowchart(code):
    fc = pyflowchart.Flowchart.from_code(code)
    return fc.flowchart()


python_code = """
a = 1
b = 2
if a < b:
    print("a is less than b")
else:
    print("a is not less than b")
"""

flowchart_text = code_to_flowchart(python_code)
print(flowchart_text)
