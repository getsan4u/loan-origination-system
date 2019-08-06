'use strict';
const mongodb = require('mongodb');
const moment = require('moment');
const ObjectId = mongodb.ObjectID;

function __formatApplicationMongoQuery(options) {
  try {
    const { req } = options;    
    const $and = [];
    const $or = [];
    if (req.query) {
      const { headerFilters, query, } = req.query;
      if (query) {
        $and.push({
          title: new RegExp(query, 'gi'),
        });
      }
      if (headerFilters) {
        if (Array.isArray(headerFilters)) {
          headerFilters.forEach(header_filter => {
            const [ header, selected, ] = header_filter.split('=');
            let selected_values = selected.split(',');
            const inner_$or = selected_values.map(value => ({
              [ header ]: { $eq: ObjectId(value) }
            }));
            $and.push({ $or: inner_$or });
          })
        } else {
          const [ header, selected, ] = headerFilters.split('=');
          if (selected) {
            let selected_values = selected.split(',');
            const inner_$or = selected_values.map(value => {
              if (ObjectId.isValid(value)) {
                return { [ header ]: { $eq: ObjectId(value) } }
              } else {
                return { [ header ]: { $eq: value } }
              }
            });
            $and.push({ $or: inner_$or });
          }
        }
      }
    }

    return { $and, $or, };

  } catch (e) {
    console.log({ e });
    return e;
  }
}

function __formatCommunicationMongoQuery(options) {
  try {
    const { req } = options;
    const $and = [];
    const $or = [];
    if (req.query) {
      const { headerFilters, query, } = req.query;
      if (query) {
        $and.push({
          subject: new RegExp(query, 'gi'),
        });
      }
      if (headerFilters) {
        if (Array.isArray(headerFilters)) {
          headerFilters.forEach(header_filter => {
            const [ header, selected, ] = header_filter.split('=');
            let selected_values = selected.split(',');
            const inner_$or = selected_values.map(value => ({
              [ header ]: { $eq: ObjectId(value) }
            }));
            $and.push({ $or: inner_$or });
          })
        } else {
          const [ header, selected, ] = headerFilters.split('=');
          if (selected) {
            let selected_values = selected.split(',');
            const inner_$or = selected_values.map(value => {
              if (ObjectId.isValid(value)) {
                return { [ header ]: { $eq: ObjectId(value) } }
              } else {
                return { [ header ]: { $eq: value } }
              }
            });
            $and.push({ $or: inner_$or });
          }
        }
      }
    }

    return { $and, $or, };

  } catch (e) {
    console.log({ e });
    return e;
  }
}

function __formatTaskMongoQuery(options) {
  try {
    const { req } = options;
    const $and = [];
    const $or = [];
    if (req.query) {
      const { headerFilters, query, } = req.query;
      if (query) {
        $and.push({
          description: new RegExp(query, 'gi'),
        });
      }
      if (headerFilters) {
        if (Array.isArray(headerFilters)) {
          const inner_$and = [];
          headerFilters.forEach(header_filter => {
            const [ header, selected, ] = header_filter.split('=');
            if (selected) {
              let selected_values = selected.split(',');
              const inner_$or = selected_values.map(value => {
                if (ObjectId.isValid(value)) {
                  return { [ header ]: { $eq: ObjectId(value) } };
                } else {
                  if (value === 'overdue') {
                    return { done: { $eq: false }, due_date: { $lte: moment().startOf('day').toISOString() } }
                  } else if (value === 'today') {
                    return { due_date: { $gte: moment().startOf('day').toISOString(), $lte: moment().add(1, 'day').startOf('day').toISOString() } }
                  } else if (value === 'tomorrow') {
                    return { due_date: { $gte: moment().add(1, 'day').startOf('day').toISOString(), $lte: moment().add(2, 'day').startOf('day').toISOString() } }
                  } else {
                    return { [ header ]: { $eq: value, } };
                  }
                }
              });
              inner_$and.push({ $or: inner_$or, });
            }
          });
          $and.push(...inner_$and);
        } else {
          const [ header, selected, ] = headerFilters.split('=');
          if (selected) {
            let selected_values = selected.split(',');
            const inner_$or = selected_values.map(value => {
              if (ObjectId.isValid(value)) {
                return { [ header ]: { $eq: ObjectId(value) } }
              } else {
                if (value === 'overdue') {
                  return { done: { $eq: false }, due_date: { $lte: moment().startOf('day').toISOString() } }
                } else if (value === 'today') {
                  return { due_date: { $gte: moment().startOf('day').toISOString(), $lte: moment().add(1, 'day').startOf('day').toISOString() } }
                } else if (value === 'tomorrow') {
                  return { due_date: { $gte: moment().add(1, 'day').startOf('day').toISOString(), $lte: moment().add(2, 'day').startOf('day').toISOString() } }
                } else {
                  return { [ header ]: { $eq: value, } };
                }
              }
            });
            $and.push({ $or: inner_$or });
          }
        }
      }
    }
    return { $and, $or, };
  } catch (e) {
    console.log({ e });
    return e;
  }
}

function __formatDocMongoQuery(options) {
  try {
    const { req } = options;
    const $and = [];
    const $or = [];
    if (req.query) {
      const { headerFilters, query, } = req.query;
      if (query) {
        $and.push({
          name: new RegExp(query, 'gi'),
        });
      }
      if (headerFilters) {
        if (Array.isArray(headerFilters)) {
          const inner_$and = [];
          headerFilters.forEach(header_filter => {
            const [ header, selected, ] = header_filter.split('=');
            if (selected) {
              let selected_values = selected.split(',');
              const inner_$or = selected_values.map(value => {
                if (ObjectId.isValid(value)) {
                  return { [ header ]: { $eq: ObjectId(value) } };
                } else {
                  return { [ header ]: { $eq: value, } };
                }
              });
              inner_$and.push({ $or: inner_$or, });
            }
          });
          $and.push(...inner_$and);
        } else {
          const [ header, selected, ] = headerFilters.split('=');
          if (selected) {
            let selected_values = selected.split(',');
            const inner_$or = selected_values.map(value => {
              if (ObjectId.isValid(value)) {
                return { [ header ]: { $eq: ObjectId(value) } }
              } else {
                return { [ header ]: { $eq: value } }
              }
            });
            $and.push({ $or: inner_$or });
          }
        }
      }
    }
    return { $and, $or, };
  } catch (e) {
    console.log({ e });
    return e;
  }
}


module.exports = {
  __formatApplicationMongoQuery,
  __formatCommunicationMongoQuery,
  __formatTaskMongoQuery,
  __formatDocMongoQuery,
};