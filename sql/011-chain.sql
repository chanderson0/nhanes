COPY (

( SELECT
  DR1IFF_G.SEQN,
  1 as DAY,
  DR1DAY as WEEKDAY,
  DR1_020 AS TIMEOFDAY,
  dr1_040z AS ATHOME,
  DBQ700 AS DIETQUALITY,
  RIAGENDR,
  RIDAGEYR,
  RIDRETH3,
  INDHHIN2,
  category_number,
  category_description,
  food_code_description
  FROM DR1IFF_G
  INNER JOIN WWEIA1112_foodcat_FNDDS ON WWEIA1112_foodcat_FNDDS.food_code = DR1IFF_G.DR1IFDCD
  INNER JOIN DEMO_G ON DR1IFF_G.SEQN = DEMO_G.SEQN
  INNER JOIN DBQ_G ON DBQ_G.SEQN = DEMO_G.SEQN
  ORDER BY DR1IFF_G.SEQN ASC, DR1IFF_G.DR1_020 ASC

) UNION ALL (

SELECT
  DR2IFF_G.SEQN,
  2 as DAY,
  DR2DAY as WEEKDAY,
  DR2_020 AS TIMEOFDAY,
  dr2_040z AS ATHOME,
  DBQ700 AS DIETQUALITY,
  RIAGENDR,
  RIDAGEYR,
  RIDRETH3,
  INDHHIN2,
  category_number,
  category_description,
  food_code_description
  FROM DR2IFF_G
  INNER JOIN WWEIA1112_foodcat_FNDDS ON WWEIA1112_foodcat_FNDDS.food_code = DR2IFF_G.DR2IFDCD
  INNER JOIN DEMO_G ON DR2IFF_G.SEQN = DEMO_G.SEQN
  INNER JOIN DBQ_G ON DBQ_G.SEQN = DEMO_G.SEQN
  ORDER BY DR2IFF_G.SEQN ASC, DR2IFF_G.DR2_020 ASC

)

) TO STDOUT WITH CSV HEADER;