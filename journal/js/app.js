
const META_KEY = '~ALL~';

const s = Snap(12000, 12000);
let render = null;
let sortVar = null, shouldReverse = false;

const meaningMap = {
  '007-gender-2.csv': {
    variableNames: {
      '1': 'Men',
      '2': 'Women'
    },
    variableOrder: [1,2]
  },
  '006-ethnicity.csv': {
    variableNames: {
      '1': 'Mexican American',
      '2': 'Other Hispanic',
      '3': 'Non-Hispanic White',
      '4': 'Non-Hispanic Black',
      '6': 'Non-Hispanic Asian',
      '7': 'Other Race - Including Multi-Racial'
    },
    variableOrder: [3,4,6,1,2,7]
  },
  '008-age.csv': {
    variableNames: {
      '<20': 'Younger than 20',
      '20-39': '20-39',
      '40-59': '40-59',
      '>60': '60 and older'
    },
    varMap: {
      '10': '<20',
      '20': '20-39',
      '30': '20-39',
      '40': '40-59',
      '50': '40-59',
      '60': '>60',
      '70': '>60',
      '80': '>60',
    },
    variableOrder: ['<20', '20-39', '40-59', '>60']
  },
  '013-bmi.csv': {
    variableNames: {
      '1': 'Underweight',
      '2': 'Normal weight',
      '3': 'Overweight',
      '4': 'Obese'
    },
    variableOrder: [2,3,4]
  },
  '014-anxiety.csv': {
    variableNames: {
      '1': 'None reported',
      '2': 'Less than 10 days',
      '3': '10 or more days'
    },
    variableOrder: [1,2,3]
  },
  '015-foodsec.csv': {
    variableNames: {
      '1': 'Often',
      '2': 'Sometimes',
      '3': 'Never'
    },
    variableOrder: [1,2,3]
  },
  '016-weightcontrol.csv': {
    variableNames: {
      '1': 'Yes',
      '2': 'No'
    },
    variableOrder: [1,2]
  },
  '017-sleep.csv': {
    variableNames: {
      '1': '6 or fewer',
      '2': '7-8',
      '3': '9 or more'
    },
    variableOrder: [1,2,3]
  },
  '018-weightchange.csv': {
    variableNames: {
      '1': 'Lost more than 5 pounds',
      '2': 'About the same',
      '3': 'Gained more than 5 pounds'
    },
    variableOrder: [1,2,3]
  },
  '019-foodpyramid.csv': {
    variableNames: {
      '1': 'Yes',
      '2': 'No'
    },
    variableOrder: [1,2]
  },
  '020-healthydiet.csv': {
    variableNames: {
      '1': 'Very good+',
      '2': 'Good',
      '3': 'Fair',
      '4': 'Poor'
    },
    varMap: {
      '1': '1',
      '2': '1',
      '3': '2',
      '4': '3',
      '5': '4'
    },
    variableOrder: [4,3,2,1]
  }
}

function parseData(rawData, dataName) {
  const dataMap = {};
  for (const row of rawData) {
    let variable = row.var;
    if (meaningMap[dataName] && meaningMap[dataName]['varMap']) {
      variable = meaningMap[dataName]['varMap'][row.var] || variable;
    }
    _.set(dataMap, [row.cat, variable], row);
  }
  return dataMap;
}

function normalizeArr(arr) {
  const sum = _.sum(arr);
  return arr.map(x => x / sum);
}

function extractMeta(data, variables) {
  const meta = _.pick(data[META_KEY], variables);
  delete data[META_KEY];

  const metaMeta = {
    count: _.sumBy(_.values(meta), 'count'),
    uniq_count: _.sumBy(_.values(meta), 'uniq_count')
  };

  for (const v in meta) {
    meta[v].average_pt_share = meta[v].count / metaMeta.count;
    meta[v].average_uniq_share = meta[v].uniq_count / metaMeta.uniq_count;
  }

  meta['all'] = metaMeta;
  return meta;
}

function applyMeta(data, meta, variables) {
  for (const cat in data) {
    const pertinent = _.pick(data[cat], variables);

    const catMeta = {
      count: _.sumBy(_.values(pertinent), 'count'),
      uniq_count: _.sumBy(_.values(pertinent), 'uniq_count')
    };

    console.log(cat, catMeta, pertinent);

    for (const v in pertinent) {
      const pt = pertinent[v];

      pt.cat_pt_share = pt.count / catMeta.count;
      pt.cat_pt_share_vs_average = pt.cat_pt_share / meta[v].average_pt_share;

      pt.cat_uniq_share = pt.uniq_count / catMeta.uniq_count;
      pt.cat_uniq_share_vs_average = pt.cat_uniq_share / meta[v].average_uniq_share;

      pt.var_pt_frac = pt.count / meta[v].count;
      pt.var_uniq_frac = pt.uniq_count / meta[v].uniq_count;
    }
  }
}

function extractVariables(data) {
  const firstKey = Object.keys(data)[0];
  const variables = Object.keys(data[firstKey]);
  variables.sort();
  return variables;
}

function filterData(data, variables, minimumCount) {
  const newData = {};
  for (const cat in data) {
    let sum = 0;
    for (const variable of variables) {
      sum += _.get(data, [cat, variable, 'uniq_count'], 0);
    }
    if (sum >= minimumCount) {
      newData[cat] = data[cat];
    }
  }
  return newData;
}

function filterInteresting(data, variables, count) {
  const dataCopy = _.cloneDeep(data);
  const newData = {};

  let iterations = 0;
  do {
    const newVars = _.shuffle(variables);
    for (const variable of newVars) {
      const max = _.maxBy(_.toPairs(dataCopy), function(r) {
        // console.log(r[1][variable]);
        return _.get(r, [1, variable, 'cat_uniq_share_vs_average'], 0);
      });

      delete dataCopy[max[0]];
      newData[max[0]] = max[1];
    }
  } while (Object.keys(newData).length < count && ++iterations < 10);

  for (let i = 0; i < 5; ++i) {
    const max = _.minBy(_.toPairs(dataCopy), function(r) {
      let val = 1.0;
      for (const variable of variables) {
        val *= _.get(r, [1, variable, 'cat_uniq_share_vs_average'], 0);
      }
      return Math.abs(1.0 - val);
    });

    delete dataCopy[max[0]];
    newData[max[0]] = max[1];
  }


  return newData;
}

function sortKeysSlope(data, variables, sortKey) {
  const firstVar = variables[0];
  const lastVar = variables[variables.length-1];

  const cats = Object.keys(data);
  cats.sort(function(a, b) {
    let aScore = 0, bScore = 0, aSum = 0, bSum = 0;
    for (let i = 0; i < variables.length; ++i) {
      aScore += (i+1) * _.get(data, [a, variables[i], sortKey], 0);
      bScore += (i+1) * _.get(data, [b, variables[i], sortKey], 0);

      aSum += _.get(data, [a, variables[i], sortKey], 0);
      bSum += _.get(data, [b, variables[i], sortKey], 0);
    }

    return bScore / bSum - aScore / aSum;

    // const aMeta = extractCatMeta(data, a);
    // const bMeta = extractCatMeta(data, b);

    // const aDiff = _.get(data, [a, lastVar, sortKey], 0) - _.get(data, [a, firstVar, sortKey], 0);
    // const bDiff = _.get(data, [b, lastVar, sortKey], 0) - _.get(data, [b, firstVar, sortKey], 0);
    // return bDiff / bMeta[sortKey] - aDiff / aMeta[sortKey];
  });
  return cats;
}

function sortKeysVar(data, sortVar, sortKey) {
  const cats = Object.keys(data);
  cats.sort(function(a, b) {
    const aVal = _.get(data, [a, sortVar, sortKey], 0);
    const bVal = _.get(data, [b, sortVar, sortKey], 0);
    return bVal - aVal;
  });
  return cats;
}

function renderPairs(data, dataName, meta, sortedCatKeys, variables, sizeValueKey) {
  const xText = 10;
  const xInit = 80, yInit = 80;
  const xMargin = 24, yMargin = 24;
  const yTopMargin = 24;
  const baseCircle = 10;

  let x = xInit, y = yInit;

  // Draw labels
  for (const variable of variables) {
    const l = s.text(x, y, _.get(meaningMap, [dataName, 'variableNames', variable], ''));
    const tMatrix = l.transform().localMatrix;
    tMatrix.rotate(-45, x, y);
    l.transform(tMatrix.toTransformString());
    l.attr({ 'font-size': '6pt',
           'alignment-baseline': 'middle', 'dominant-baseline': 'middle' });

    l.click(() => {
      if (sortVar == variable) {
        shouldReverse = !shouldReverse;
      } else {
        sortVar = variable;
      }

      render();
    });

    x += xMargin;
  }

  y += yTopMargin;

  for (const cat of sortedCatKeys) {
    const catVars = data[cat];
    // const catMeta = extractCatMeta(data, cat, meta);

    x = xInit;

    for (const variable of variables) {
      // if (variable == '2') continue;
      let val;

      // val = _.get(catVars, [variable, sizeValueKey], 0);
      // val /= catMeta[sizeValueKey];

      val = _.get(catVars, [variable, sizeValueKey], 0);

      // map to near 1
      // if (val > 1.0) {
      //   val = Math.pow(val, 1.0/3.0);
      // }

      /// LINES
      // {
      //   let r;
      //   const h = Math.abs(val - 1.0) * baseCircle;
      //   if (val > 1.0) {
      //     r = s.rect(x, y - h, 20, h);
      //     r.attr({ fill: '#00ff00'});
      //   } else {
      //     r = s.rect(x, y, 20, h);
      //     r.attr({ fill: '#ff0000'});
      //   }
      //   r.attr({ stroke: 'none' });

      //   const baseline = s.line(x, y, x + 20, y);
      //   baseline.attr({ opacity: 0.5, stroke: '#999', fill: 'none' });
      // }

      /// CIRCLES
      // {
      //   const c = s.circle(x, y, baseCircle * val);
      //   c.attr({ stroke: 'none', fill: '#000' });

      //   const outline = s.circle(x, y, baseCircle);
      //   outline.attr({ opacity: 0.5, stroke: '#999', fill: 'none' });
      // }

      /// GRID
      {
        const r = s.rect(x - xMargin / 2.0 + 1.0, y - yMargin / 2.0 + 1.0, xMargin - 2.0, yMargin - 2.0);
        const opacity = Math.min(1.0, val / 2.0);

        let color1 = tinycolor("#1543AA");
        let color2 = tinycolor("#15AA1F");

        let color;
        if (variable == '1') {
          color = color1;
        } else {
          color = color2;
        }

        // let color = tinycolor('#1543AA');
        // let color = tinycolor('#7731D3');
        // let color = tinycolor('#E84D00');

        let mix = tinycolor.mix(tinycolor('#fff'), color, opacity * 100).toHexString();

        r.attr({ fill: mix, opacity: 1 });


        const pct = _.get(catVars, [variable, 'var_uniq_frac'], 0);

        const t = s.text(x, y, `${(pct*100.0).toFixed(0)}%`);
        // t.attr({ dy: '-0.55em' });
        // const t2 = s.text(x, y, `${val.toFixed(2)}x`);
        // t2.attr({ dy: '0.55em' });

        // const t = s.text(x, y, `${val.toFixed(2)}x`);
        // const t = s.text(x, y, `${(pct*100.0).toFixed(pct < 0.1 ? 1 : 0)}%`);

        t.attr({
          'dominant-baseline': 'central',
          'text-anchor': 'middle',
          'font-size': '4pt',
        });

        // if (val > 0.92) {
          t.attr({ fill: '#fff' });
        // }

        t.remove();

        // t2.attr({
        //   'dominant-baseline': 'central',
        //   'text-anchor': 'middle',
        //   'font-size': '6pt'
        // });

        // // if (val > 0.92) {
        //   t2.attr({ fill: '#fff' });
        // // }
      }

      x += xMargin;
    }

    x += -10;
    const t = s.text(x, y, cat.replace(/ \(.*?\)/, ''));
    t.attr({ 'font-size': '6pt', 'dominant-baseline': 'central' });

    y += yMargin;
  }
}

function handleData(data, dataName) {
  if (data.error) {
    console.log('Error parsing', data.error);
  }

  const parsed = parseData(data.data, dataName);
  const variables = meaningMap[dataName].variableOrder || extractVariables(parsed);
  const meta = extractMeta(parsed, variables);
  applyMeta(parsed, meta, variables);

  console.log(parsed, meta);

  render = () => {
    s.clear();

    let filtered = filterData(parsed, variables, 100);
    // filtered = filterInteresting(filtered, variables, 30);

    let sortedKeys;
    if (sortVar !== null) {
      sortedKeys = sortKeysVar(filtered, sortVar, 'cat_uniq_share_vs_average');
      // sortedKeys = sortKeysVar(filtered, sortVar, 'var_uniq_frac');
    } else {
      sortedKeys = sortKeysSlope(filtered, variables, 'cat_uniq_share_vs_average');
      // sortedKeys = Object.keys(filtered);
      // sortedKeys.sort();
    }
    // sortedKeys = Object.keys(filtered);
    // sortedKeys.sort();

    if (shouldReverse) {
      sortedKeys.reverse();
    }

    // const page = s.rect(0, 0, 360, 522);
    // page.attr({ fill: 'none', stroke: '#000' });

    // const border = s.rect(63, 56, 360 - (63 + 56), 522 - (56 + 56));
    // border.attr({ fill: 'none', stroke: '#666' });

    renderPairs(filtered, dataName, meta, sortedKeys, variables, 'cat_uniq_share_vs_average');
  }

  render();
}

// const file = '008-age.csv';
const file = '007-gender-2.csv';
// const file = '006-ethnicity.csv';
// const file = '012-tv.csv';
// const file = '013-bmi.csv';
// const file = '014-anxiety.csv';
// const file = '015-foodsec.csv';
// const file = '016-weightcontrol.csv';
// const file = '017-sleep.csv';
// const file = '018-weightchange.csv';
// const file = '019-foodpyramid.csv';
// const file = '020-healthydiet.csv';

Papa.parse(`data/${file}`, {
  download: true,
  dynamicTyping: true,
  header: true,
  skipEmptyLines: true,
  complete: (data) => handleData(data, file)
});
