import xport
import csv
import sys

# with xport.XportReader(sys.argv[1]) as reader:
#     writer = csv.DictWriter(sys.stdout, [f['name'] for f in reader.fields])
#     writer.writeheader()
#     for row in reader:
#         writer.writerow(row)


with open(sys.argv[1], 'rb') as f:
  reader = xport.DictReader(f)
  writer = csv.DictWriter(sys.stdout, reader.fields)
  writer.writeheader()
  for row in reader:
    writer.writerow(row)
