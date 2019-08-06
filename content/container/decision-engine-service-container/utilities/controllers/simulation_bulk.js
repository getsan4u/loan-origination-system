'use strict';
const periodic = require('periodicjs');

function formatTestCaseName({ rows, }) {
  try {
    return rows.map(row => {
      if (row.name) {
        row.name = row.name.toString();
        row.displayname = row.name.replace(/[^a-zA-Z\d\s]/g, '');
        row.name = row.displayname.replace(/\s/g, '_').toLowerCase();
      } else {
        throw new Error('CSV is missing name header.');
      }
      return row;
    });
  } catch (err) {
    return err;
  }
}

function checkTestCasesNamesInCSV({ rows = [], }) {
  try {
    let duplicateTestCases = [];
    rows.reduce((uniqueTestCases, curr) => {
      if (uniqueTestCases[ curr.name ]) {
        duplicateTestCases.push(curr.name);
      } else {
        uniqueTestCases[ curr.name ] = true;
      }
      return uniqueTestCases;
    }, {});
    if (duplicateTestCases.length) return new Error(`The following cases have duplicates names in the csv: ${duplicateTestCases.join(', ')}. Please make sure names are unique.`);
  } catch (err) {
    return err;
  }
}

async function sortPopulationTags({ organization, rows }) {
  try {
    const PopulationTag = periodic.datas.get('standard_populationtag');
    let populateTagMap = {};
    let tagId;
    let newTags;
    let uniqueTags = rows.reduce((tags, testcase) => {
      if (testcase.population_tags) {
        testcase.population_tags.forEach(tag => {
          tags[ tag ] = true;
        });
      }
      return tags;
    }, {});
    if (Object.keys(uniqueTags).length) {
      let existingTags = await PopulationTag.query({ query: { name: { $in: Object.keys(uniqueTags), }, organization, }, });
      existingTags = existingTags.map(tag => tag.toJSON ? tag.toJSON() : tag).filter(tag => tag !== null);
      tagId = existingTags.reduce((acc, curr) => {
        acc[ curr.name ] = curr._id;
        populateTagMap[ curr._id ] = (curr.max_index) ? { _id: curr._id, max_index: curr.max_index, } : { _id: curr._id, max_index: 0, };
        return acc;
      }, {});
      existingTags = existingTags.map(tag => tag.name);
      existingTags.forEach(existing => {
        uniqueTags[ existing ] = false;
      });
      newTags = Object.keys(uniqueTags).filter(tag => uniqueTags[ tag ]);
      return { newTags, tagId, populateTagMap, }
    } else {
      return { newTags: [], tagId: {}, populateTagMap: {}, };
    }
  } catch (error) {
    return { newTags: [], tagId: {}, populateTagMap: {}, };
  }
}

async function createNewPopulationTags({ newTags = [], user, organization, populateTagMap, tagId, rows, }) {
  try {
    if (newTags.length) {
      const PopulationTag = periodic.datas.get('standard_populationtag');
      let createOptions = {
        newdoc: newTags.map(tagname => ({
          name: tagname,
          user: `${user.first_name} ${user.last_name}`,
          organization: organization,
        })),
        bulk_create: true,
      };
      let tags = await PopulationTag.create(createOptions) || [];
      tags.reduce((acc, curr) => {
        curr = curr.toJSON ? curr.toJSON() : {};
        acc[ curr.name ] = curr._id;
        populateTagMap[ curr._id ] = (curr.max_index) ? { name: curr.name, max_index: curr.max_index, } : { _id: curr._id, max_index: 0, };
        return acc;
      }, tagId);
      return { tagId, populateTagMap, };
    } else {
      return {
        tagId: tagId || {},
        populateTagMap: populateTagMap || {},
      };
    }
  } catch (error) {
    return {
      tagId: tagId || {},
      populateTagMap: populateTagMap || {},
    };
  }
}

function findOneAndUpdateTestCase({ query, createdoc, options, }) {
  return new Promise((resolve, reject) => {
    try {
      const TestCase = periodic.datas.get('standard_testcase');
      TestCase.model.findOneAndUpdate(query, createdoc, options, (err, doc) => {
        resolve(doc);
      });
    } catch (err) {
      return reject(err);
    }
  });
}

async function createOrUpdateTestCases({ rows, organization, }) {
  try {
    rows = rows.map(createdoc => findOneAndUpdateTestCase(
      {
        query: { name: createdoc.name, organization, },
        createdoc,
        options: {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      }
    ));
    let created = await Promise.all(rows);
    return created || [];
  } catch (err) {
    return err;
  }
}

async function createNewTestCases({ user, organization, rows, populateTagMap, }) {
  try {
    const PopulationTag = periodic.datas.get('standard_populationtag');
    rows = rows.map(tc => {
      tc.updatedat = new Date();
      if (tc.population_tags && tc.population_tags.length) {
        tc.population_tags = tc.population_tags.filter(tag => tag !== null);
        tc.indices = tc.population_tags.reduce((returnData, ptag) => {
          let ptagDoc = populateTagMap[ ptag ];
          let ptag_name = (ptagDoc && ptagDoc.name) ? ptagDoc.name : ptag;
          if (ptagDoc) {
            populateTagMap[ ptag ].max_index = ptagDoc.max_index + 1;
            returnData[ ptag_name ] = ptagDoc.max_index;
          }
          return returnData;
        }, {});
      }
      return Object.assign({}, tc, {
        user: {
          creator: `${user.first_name} ${user.last_name}`,
          updater: `${user.first_name} ${user.last_name}`,
        },
        organization,
      });
    });
    let testcases = await createOrUpdateTestCases({ rows, organization, });
    testcases.forEach(tc => {
      tc.population_tags.forEach(tagId => {
        if (populateTagMap[ tagId ] && populateTagMap[ tagId ].testcases) populateTagMap[ tagId ].testcases.push(tc._id.toString());
        else if (populateTagMap[ tagId ]) populateTagMap[ tagId ].testcases = [ tc._id.toString(), ];
      });
    });
    await Promise.all(Object.keys(populateTagMap).map(tag_id => {
      return PopulationTag.update({
        id: tag_id,
        isPatch: true,
        updatedoc: { max_index: populateTagMap[ tag_id ].max_index, testcases: populateTagMap[ tag_id ].testcases, },
      });
    }));
    return true;
  } catch (error) {
    return error;
  }
}

async function handleTestCasesBatch({ rows, organization, user, }) {
  try {
    rows = formatTestCaseName({ rows });
    checkTestCasesNamesInCSV({ rows, organization });
    let { newTags, tagId, populateTagMap, } = await sortPopulationTags({ rows, organization });
    let updatedTagData = await createNewPopulationTags({ user, organization, rows, newTags, tagId, populateTagMap, });
    tagId = updatedTagData.tagId;
    populateTagMap = updatedTagData.populateTagMap;
    rows = rows.map(tc => {
      tc.population_tags = tc.population_tags.reduce((reduced, tagname) => {
        if (tagname !== null && tagId[ tagname ]) reduced.push(tagId[ tagname ]);
        return reduced;
      }, []);
      return tc;
    });
    await createNewTestCases({ user, organization, rows, populateTagMap, });
  } catch (e) {
    return e;
  }
}

module.exports = {
  createNewTestCases,
  formatTestCaseName,
  checkTestCasesNamesInCSV,
  createNewPopulationTags,
  sortPopulationTags,
  handleTestCasesBatch,
};