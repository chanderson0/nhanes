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
    CASE WHEN SLD010H <= 6 THEN '1'
         WHEN SLD010H < 9 THEN '2'
         ELSE '3'
    END AS var,
    COUNT(*) as count,
    COUNT(DISTINCT DEMO_G.SEQN) as uniq_count
  FROM
    DEMO_G
  RIGHT OUTER JOIN food ON DEMO_G.SEQN = food.SEQN
  RIGHT OUTER JOIN SLQ_G ON DEMO_G.SEQN = SLQ_G.SEQN
  WHERE
    SLD010H IS NOT NULL
    AND SLD010H <= 13
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
