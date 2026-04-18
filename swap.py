import sys

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Extract Grid Layout
grid_start = text.find('<!-- ================= GRID ================= -->\n        <div class="grid-layout">')
grid_end = text.find('</main>')
if grid_start == -1 or grid_end == -1:
    print("Cannot find grid layout")
    sys.exit(1)

grid_content = text[grid_start:grid_end]

# 2. Extract Quote & AI Chat 
insights_start = text.find('<!-- DAILY QUOTE -->')
insights_end = text.find('</div>\n    </div>\n\n    <!-- ================= TASKS OVERRIDE')
if insights_start == -1 or insights_end == -1:
    print("Cannot find insights content")
    sys.exit(1)

insights_content = text[insights_start:insights_end]

# 3. Modify text
# A. Remove quote & AI from insights sheet, and replace with grid_content!
# Wait, let's just do text.replace
text = text[:insights_start] + grid_content + text[insights_end:]

# B. Remove grid_content from main block, and replace with insights_content!
text = text.replace(grid_content, '\n        <!-- ================= ZEN HOME ================= -->\n        <div id="zen-home-feed">\n            ' + insights_content + '\n        </div>\n    ')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Swap Successful")
