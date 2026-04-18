import re

with open('app/(dashboard)/admin/katalog/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Only analyze the content inside the main return (line 144 onwards)
# Or just analyze the whole file but be careful with self-closing and same-line tags
stack = []

# Find all <div and </div with positions
tags = []
for m in re.finditer(r'<div(?![a-zA-Z0-9])', text):
    tags.append((m.start(), 'open'))
for m in re.finditer(r'</div', text):
    tags.append((m.start(), 'close'))

tags.sort()

line_offsets = [0]
for m in re.finditer(r'\n', text):
    line_offsets.append(m.end())

def get_line(pos):
    for i, offset in enumerate(line_offsets):
        if offset > pos:
            return i
    return len(line_offsets)

for pos, type in tags:
    if type == 'open':
        stack.append(pos)
    else:
        if not stack:
            print(f"Extra CLOSE at line {get_line(pos)}")
        else:
            stack.pop()

for remaining_pos in stack:
    print(f"Unclosed OPEN from line {get_line(remaining_pos)}")
