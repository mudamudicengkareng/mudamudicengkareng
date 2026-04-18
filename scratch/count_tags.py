import re

with open('app/(dashboard)/admin/katalog/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Simple regex to find <div and </div
# Note: this is naive for JSX but can give a hint
opens = re.findall(r'<div', content)
closes = re.findall(r'</div', content)

print(f"Total <div starts: {len(opens)}")
print(f"Total </div ends: {len(closes)}")

# Let's also look for other tags
all_opens = re.findall(r'<[a-zA-Z]', content)
all_closes = re.findall(r'</[a-zA-Z]', content)
print(f"Total tags starts: {len(all_opens)}")
print(f"Total tags ends: {len(all_closes)}")
