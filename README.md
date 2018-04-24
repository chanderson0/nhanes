### NHANES Explorer

Supporting data for ["When the Government Counts Calories"](https://heyanderson.com/projects/nhanes) from the OCR Journal #0002.

![men vs women](https://user-images.githubusercontent.com/73099/39162010-65ac4fc2-4741-11e8-93e0-e0bc1adf4811.png)

#### Requirements

- Python / PIP
- xport: `pip install xport`
- Node / NPM
- Postgres (create a database called `nhanes`)

#### Process data

```sh
npm install

# Scrape and convert data
# ./process.sh [YEAR-PAIR] [FILENAME]
./process.sh 2011-2012 DR1IFF_G

# Insert non-unique tables
# ./insert.sh [FILENAME] [USE_PKEY?]
./insert.sh DR1IFF_G false

# (if the data is unique, leave off the last variable)
./insert.sh OCQ_G

# Food labels are different
node insert_food.js processed/DRXFCD_G.labels.csv processed/DRXFCD_G.csv
```

#### Visualization server

Use a static site serving tool on `journal`, e.g.:

```sh
cd journal
python -m http.server 8000
```

Requires editing `journal/app/app.js` to see different visualizations.
