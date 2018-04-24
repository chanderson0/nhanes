DROP TABLE WWEIA1112_foodcat_FNDDS;

CREATE TABLE WWEIA1112_foodcat_FNDDS (
  food_code int,
  food_code_description varchar(255),
  category_number int,
  category_description varchar(255),
  reports_day1 int,
  reports_day2 int
);

\copy WWEIA1112_foodcat_FNDDS FROM './WWEIA1112_foodcat_FNDDS.csv' DELIMITER ',' CSV HEADER;
