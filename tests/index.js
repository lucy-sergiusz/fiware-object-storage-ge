'use strict';

const debug = require('debug')('fiware-object-storage-ge:test');
const fs = require('fs');
const path = require('path');
const mime = require('mime');

const objectStorage = require('../lib/index.js');

/**
 * Config build from enviromental variables
 */
const config = {
  container: process.env.CONTAINER,
  user: process.env.USER,
  password: process.env.PASSWORD,
  region: process.env.REGION
};

/**
 * fs.readFile promise wrapper
 */
function readFilePromise (file) {
  return new Promise(function (resolve, reject) {
    fs.readFile(file, function (err, buffer) {
      if (err) {
        return reject(err);
      }

      resolve(buffer);
    });
  });
}

// create storage instance
const storage = objectStorage(config);

// const objectName = 'test.json';
const objectName = 'test.png';
// const objectName = 'test.txt';
const objectPath = path.join(__dirname, `input/${objectName}`);
const objectMimetype = mime.lookup(objectName);

/**
 * Start the tests
 */
storage.initiate()
  // lookup tenant
  .then(() => storage.lookupTenant())
  .then(debug.bind((debug, 'TenantID info:')))

  // create container
  .then(() => storage.createContainer(config.container))

  // list available containers
  .then(() => storage.getContainerList())
  .then(debug.bind(debug, 'Containers:'))

  // upload file
  .then(() => readFilePromise(objectPath))
  // .then(() => new Buffer(JSON.stringify({test: 'test'})))
  .then((objectContents) => storage.putObject(objectName, objectMimetype, objectContents))

  // list container objects
  .then(() => storage.listContainer())
  .then(debug.bind(debug, 'Container files:'))

  // retrieve container object
  .then(() => storage.getObject(objectName))
  .then((objectContents) => {
    // console.log(objectContents.toString('utf-8'));

    return new Promise((resolve, reject) => {
      const filename = path.join(__dirname, 'out', objectName);

      fs.writeFile(filename, objectContents, function (err, written) {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });
  })

  // delete object
  .then(() => storage.deleteObject(objectName))

  // remove container
  .then(() => storage.deleteContainer(config.container))

  .catch((err) => {
    console.log(err.message);
    console.error(err.stack);
  });
