const K8sConfig = require('kubernetes-client').config
const Client = require('kubernetes-client').Client

// This should be inserted via CI
const config = K8sConfig.fromKubeconfig('./config');

const client = new Client({ config, version: '1.9' })
const deployements = client.apis.apps.v1.namespaces('default').deployments;
const services = client.api.v1.namespaces('default').services;
const ingresses = client.apis.extensions.v1beta1.namespaces('default').ingresses;

const create = (event) => success()
const update = (event) => success()
const destroy = (event) => success()
const list = async (event, context, callback) => {
  const { body } = await ingresses.get()
  
  return success(callback, body.items);
}

/**
 * Return a 
 * @param {String} message 
 */
const success = (callback, message = 'Success') => (callback(null, {
  statusCode: 200,
    body: JSON.stringify({
      data: message
    }),
  }));

module.exports = { create, destroy, update, list }