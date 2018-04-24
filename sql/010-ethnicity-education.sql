COPY (

WITH

-- Get the baseline
baseline_raw AS (
  SELECT
    DMDEDUC2 as var,
    COUNT(*) as count
  FROM
    DEMO_G
  WHERE
    RIDAGEYR IS NOT NULL
    AND RIDAGEYR >= 25
    AND RIDAGEYR <= 65
    AND DMDEDUC2 IS NOT NULL
    AND RIDRETH3 IS NOT NULL
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
    RIDRETH3 AS cat,
    DMDEDUC2 as var,
    COUNT(*) as count,
    COUNT(DISTINCT DEMO_G.SEQN) as uniq_count
  FROM
    DEMO_G
  WHERE
    RIDAGEYR IS NOT NULL
    AND RIDAGEYR >= 25
    AND RIDAGEYR <= 65
    AND DMDEDUC2 IS NOT NULL
    AND RIDRETH3 IS NOT NULL
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
