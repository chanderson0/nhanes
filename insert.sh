#!/bin/bash
# Load data from file, save to db

FILE=$1
USE_PKEY=$2

node create_table.js processed/$FILE.labels.csv $USE_PKEY
node insert_data.js processed/$FILE.csv
