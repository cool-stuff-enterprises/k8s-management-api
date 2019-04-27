const K8sConfig = require('kubernetes-client').config
const Client = require('kubernetes-client').Client

// This should be inserted via CI
const config = K8sConfig.fromKubeconfig('.config');

const client = new Client({ config, version: '1.9' })

const create = (event) => success()
const update = (event) => success()
const destroy = (event) => success()
const list = (event) => success()

/**
 * Return a 
 * @param {String} message 
 */
const success = (message = 'Success') => ({
  statusCode: 200,
    body: JSON.stringify({
      message: message
    }),
  });

module.exports = { create, destroy, update, list }