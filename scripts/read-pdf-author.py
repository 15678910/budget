import sys
import io
import pathlib

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from PyPDF2 import PdfReader

p = pathlib.Path(r'G:\내 드라이브\사업\디지털자산\새로운 화폐 혁명.pdf')
if not p.exists():
    # Try alternate paths
    import glob
    candidates = list(pathlib.Path('G:/').rglob('*화폐*혁명*.pdf'))
    print('File not found. Candidates:', candidates)
    sys.exit(1)

reader = PdfReader(str(p))
print(f'Total pages: {len(reader.pages)}')
print(f'Metadata: {reader.metadata}')
print()

for i in range(min(5, len(reader.pages))):
    text = reader.pages[i].extract_text()
    print(f'=== PAGE {i+1} ===')
    print(text[:2000])
    print()
