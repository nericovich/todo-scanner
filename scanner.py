import sys
import os
import re
import json

def scan_todos(root_dir):
    results = []
    todo_regex = re.compile(r'\b(TODO|FIXME|NOTE|BUG):?\s*(.*)$', re.IGNORECASE)
    ignored_dirs = {'.git', 'node_modules', '__pycache__', 'venv', '.venv', 'dist', 'build'}

    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in ignored_dirs]
        
        for file in files:
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    for line_num, line in enumerate(f):
                        match = todo_regex.search(line)
                        if match:
                            tag = match.group(1).upper()
                            message = match.group(2).strip() or "Без описания"
                            results.append({
                                "tag": tag,
                                "message": message,
                                "file": os.path.abspath(file_path),
                                "line": line_num
                            })
            except Exception:
                continue
                
    return results

if __name__ == '__main__':
    folder_to_scan = sys.argv[1] if len(sys.argv) > 1 else '.'
    data = scan_todos(folder_to_scan)

    print(json.dumps(data, ensure_ascii=False))