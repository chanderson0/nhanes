COPY (

SELECT (BMXHT::float * 0.393700787 / 3)::int * 3 as HEIGHT,
       RIAGENDR AS GENDER,
       COUNT(DISTINCT DEMO_G.SEQN) AS PERSON_COUNT
FROM DEMO_G
INNER JOIN DR1IFF_G ON DEMO_G.SEQN = DR1IFF_G.SEQN
INNER JOIN WWEIA1112_foodcat_FNDDS ON WWEIA1112_foodcat_FNDDS.food_code = DR1IFF_G.DR1IFDCD
INNER JOIN BMX_G ON BMX_G.SEQN = DEMO_G.SEQN
WHERE BMXHT IS NOT NULL
  AND BMXHT > 0
  AND RIDAGEYR > 18
GROUP BY GENDER, HEIGHT
ORDER BY GENDER ASC, HEIGHT ASC

) TO STDOUT WITH CSV HEADER;