COPY (

-- Select all the food across both days
WITH food AS (
    ( SELECT
        SEQN,
        category_number,
        category_description
      FROM
        DR1IFF_G
      INNER JOIN WWEIA1112_foodcat_FNDDS ON WWEIA1112_foodcat_FNDDS.food_code = DR1IFF_G.DR1IFDCD )
  UNION ALL (
      SELECT
        SEQN,

        category_number,
        category_description
      FROM
        DR2IFF_G
      INNER JOIN WWEIA1112_foodcat_FNDDS ON WWEIA1112_foodcat_FNDDS.food_code = DR2IFF_G.DR2IFDCD )
  )

-- Join on a specific variable
SELECT
  category_description AS cat,
  RIAGENDR as gender,
  COUNT(*) as count,
  COUNT(DISTINCT DEMO_G.SEQN) as uniq_count
FROM
  DEMO_G
RIGHT OUTER JOIN food ON DEMO_G.SEQN = food.SEQN
WHERE
  RIAGENDR IS NOT NULL
  AND RIDAGEYR >= 18 -- Exclude people who are too young
GROUP BY
  cat,
  gender
ORDER BY
  cat ASC,
  gender ASC

) TO STDOUT WITH CSV HEADER;
