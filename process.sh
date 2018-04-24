#!/bin/bash

# Load data from CDC, save to file

YEAR=$1
FILE=$2

wget https://wwwn.cdc.gov/Nchs/Nhanes/$YEAR/$FILE.XPT -O raw/$FILE.XPT
python convert.py raw/$FILE.XPT > processed/$FILE.csv
node scrape.js https://wwwn.cdc.gov/Nchs/Nhanes/$YEAR/$FILE.htm > processed/$FILE.labels.csv
