const K8sConfig = require('kubernetes-client').config
const Client = require('kubernetes-client').Client

// This should be inserted via CI
const config = K8sConfig.fromKubeconfig('./config');

const client = new Client({ config, version: '1.9' })
const deployements = client.apis.apps.v1.namespaces('default').deployments;
const services = client.api.v1.namespaces('default').services;
const ingresses = client.apis.extensions.v1beta1.namespaces('default').ingresses;

const create = async (event, context, callback) => {
  // name
  // image
  // port 
  console.log(event.body)
  const body = JSON.parse(event.body);

  const deployment = deployements.post({ body: { "apiVersion": "apps/v1", "kind": "Deployment", "metadata": { "name": `${name}-deployment`, "labels": { "app": name } }, "spec": { "replicas": 1, "selector": { "matchLabels": { "app": body.name } }, "template": { "metadata": { "labels": { "app": body.name } }, "spec": { "containers": [{ "name": body.name, "image": body.image, "ports": [{ "containerPort": body.port }] }] } } } } })
  const service = services.post({ body: { "apiVersion": "v1", "kind": "Service", "metadata": { "name": `${body.name}-service`, "namespace": "default" }, "spec": { "selector": { "app": body.name }, "type": "ClusterIP", "ports": [{ "protocol": "TCP", "port": body.port }] } } })
  const ingress = ingresses.post({ body: { "apiVersion": "extensions/v1beta1", "kind": "Ingress", "metadata": { "name": `${body.name}-ingress`, "namespace": "default", "annotations": { "kubernetes.io/ingress.class": "traefik" } }, "spec": { "rules": [{ "host": `${body.name}.samuelstenton.com`, "http": { "paths": [{ "backend": { "serviceName": `${body.name}-service`, "servicePort": body.port } }] } }] } } });

  await Promise.all([deployment, service, ingress]).catch(console.log)
  return success(callback);
}
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