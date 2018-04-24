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
  ),

-- Get the baseline
baseline_raw AS (
  SELECT
    PAQ715 as var,
    COUNT(*) as count
  FROM
    DEMO_G
  INNER JOIN PAQ_G ON DEMO_G.SEQN = PAQ_G.SEQN
  WHERE
    PAQ715 IS NOT NULL
    -- AND PAQ715 > 0
    AND PAQ715 != 99
    AND PAQ715 != 77
    AND RIDAGEYR >= 18 -- Exclude people who are too young
    AND RIDAGEYR <= 32
  GROUP BY var ),

-- Baseline stats
baseline_sum AS (
  SELECT
    SUM(count) as sum
  FROM
    baseline_raw ),
baseline AS (
  SELECT
    var,
    SUM(count) as count,
    SUM(count)::float / ( SELECT sum FROM baseline_sum LIMIT 1 ) as fract
  FROM
    baseline_raw
  GROUP BY var
  ORDER BY var ASC ),

-- Raw data
food_var_raw AS (
  SELECT
    category_description AS cat,
    PAQ715 as var,
    COUNT(*) as count,
    COUNT(DISTINCT DEMO_G.SEQN) as uniq_count
  FROM
    DEMO_G
  INNER JOIN PAQ_G ON DEMO_G.SEQN = PAQ_G.SEQN
  RIGHT OUTER JOIN food ON DEMO_G.SEQN = food.SEQN
  WHERE
    PAQ715 IS NOT NULL
    -- AND PAQ715 > 0
    AND PAQ715 != 99
    AND PAQ715 != 77
    AND RIDAGEYR >= 18 -- Exclude people who are too young
    AND RIDAGEYR <= 32
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
    count::float / (SELECT sum_count FROM food_sum WHERE food_sum.cat = food_var_raw.cat) as count_fract,
    (count::float / (SELECT sum_count FROM food_sum WHERE food_sum.cat = food_var_raw.cat)) / (SELECT fract from baseline WHERE baseline.var = food_var_raw.var) AS norm_count_fract,
    uniq_count,
    uniq_count::float / (SELECT sum_uniq_count FROM food_sum WHERE food_sum.cat = food_var_raw.cat) as uniq_fract,
    (uniq_count::float / (SELECT sum_uniq_count FROM food_sum WHERE food_sum.cat = food_var_raw.cat)) / (SELECT fract from baseline WHERE baseline.var = food_var_raw.var) AS norm_uniq_fract
  FROM
    food_var_raw
  ORDER BY
    cat ASC,
    var ASC )

SELECT * FROM food_var

) TO STDOUT WITH CSV HEADER;
