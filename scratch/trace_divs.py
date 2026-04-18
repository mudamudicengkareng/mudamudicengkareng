import re

with open('app/(dashboard)/admin/katalog/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

opens = []
closes = []

for i, line in enumerate(lines):
    # Find all <div (not follow by >)
    for m in re.finditer(r'<div(?![a-zA-Z0-9])', line):
        opens.append(i + 1)
    # Find all </div
    for m in re.finditer(r'</div', line):
        closes.append(i + 1)

print("OPENS:", opens)
print("CLOSES:", closes)

# Match them up using a stack
stack = []
imbalances = []

all_tags = sorted([(line, 'open') for line in opens] + [(line, 'close') for line in closes])

for line, type in all_tags:
    if type == 'open':
        stack.append(line)
    else:
        if not stack:
            print(f"Extra CLOSE at line {line}")
        else:
            stack.pop()

for remaining in stack:
    print(f"Unclosed OPEN from line {remaining}")
