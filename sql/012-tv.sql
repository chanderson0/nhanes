COPY (

WITH

-- Select all the food across both days
food AS (
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
  UNION ALL (
      SELECT
        SEQN,
        9999999,
        '~ALL~'
      FROM
        (SELECT * FROM DR1IFF_G
         UNION ALL
         SELECT * FROM DR2IFF_G) AS data )
  ),

-- Raw data
food_var_raw AS (
  SELECT
    category_description AS cat,
    PAQ710 as var,
    COUNT(*) as count,
    COUNT(DISTINCT DEMO_G.SEQN) as uniq_count
  FROM
    DEMO_G
  RIGHT OUTER JOIN food ON DEMO_G.SEQN = food.SEQN
  RIGHT OUTER JOIN PAQ_G ON DEMO_G.SEQN = PAQ_G.SEQN
  WHERE
    PAQ_G.PAQ710 IS NOT NULL
    AND RIDAGEYR >= 18
  GROUP BY
    cat,
    var
  ORDER BY
    cat ASC,
    var ASC ),

-- Food stats
food_sum AS (
  SELECT
    cat,
    SUM(count) as sum_count,
    SUM(uniq_count) as sum_uniq_count
  FROM food_var_raw
  GROUP BY cat ),
food_var AS (
  SELECT
    cat,
    var,
    count,
    uniq_count
  FROM
    food_var_raw
  ORDER BY
    cat ASC,
    var ASC )

SELECT * FROM food_var

) TO STDOUT WITH CSV HEADER;
