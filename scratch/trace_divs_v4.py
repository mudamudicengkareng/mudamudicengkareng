import re

with open('app/(dashboard)/admin/katalog/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

line_offsets = [0]
for m in re.finditer(r'\n', text):
    line_offsets.append(m.end())

def get_line(pos):
    for i, offset in enumerate(line_offsets):
        if offset > pos:
            return i
    return len(line_offsets)

stack = []
tags = []
for m in re.finditer(r'<div(?![a-zA-Z0-9])', text):
    tags.append((m.start(), 'open'))
for m in re.finditer(r'</div', text):
    tags.append((m.start(), 'close'))

tags.sort()

for pos, type in tags:
    if type == 'open':
        stack.append((pos, get_line(pos)))
    else:
        if not stack:
            print(f"Extra CLOSE at line {get_line(pos)}")
        else:
            open_pos, open_line = stack.pop()
            if open_line > 140:
                print(f"Line {get_line(pos)}: closes div from line {open_line}")

print("\nREMAINING ON STACK:")
for pos, line in stack:
    print(f"Unclosed OPEN from line {line}")
