const K8sConfig = require('kubernetes-client').config
const Client = require('kubernetes-client').Client

// This should be inserted via CI
const config = K8sConfig.fromKubeconfig('./config');

const client = new Client({ config, version: '1.9' })
const deployements = client.apis.apps.v1.namespaces('default').deployments;
const services = client.api.v1.namespaces('default').services;
const ingresses = client.apis.extensions.v1beta1.namespaces('default').ingresses;

const availableServices = [
  { id: 'mysql', image: 'mysql:5', port: 3306, environment: [{ name: 'MYSQL_ROOT_PASSWORD', value: 'mypassword'}]}
]

/**
 * Create a new deployment
 * @param {Object} event 
 * @param {Object} context 
 * @param {Function} callback 
 */
const create = async (event, context, callback) => {
  // name
  // image
  // port 
  const body = JSON.parse(event.body);

  const frontend = {
    "name": body.name,
      "image": body.image,
        "ports": [
          {
            "containerPort": parseInt(body.port)
          }
        ]
  }
  const linkedSerivces = body.services.map(service => {
    const selected = availableServices.filter(s => s.id == service).pop();
    return {
      "name": `${body.name}-service-${selected.id}`,
      "image": selected.image,
      "env": selected.environment,
      "ports": [
        {
          "containerPort": parseInt(selected.port)
        }
      ],
    }
  });

  const servicePorts = [
    { "protocol": "TCP", "name": 'web', "port": parseInt(body.port) },
    ...services.map(service => ({ "protocol": "TCP", "name": service.name, "port": parseInt(service.ports.pop().containerPort)}))
  ];

  const deployment = deployements.post({ body: { "apiVersion": "apps/v1", "kind": "Deployment", "metadata": { "name": `${body.name}-deployment`, "labels": { "app": body.name } }, "spec": { "replicas": 1, "selector": { "matchLabels": { "app": body.name } }, "template": { "metadata": { "labels": { "app": body.name } }, "spec": { "containers": [frontend, ...linkedSerivces] } } } } })
  const service = services.post({ body: { "apiVersion": "v1", "kind": "Service", "metadata": { "name": `${body.name}-service`, "namespace": "default" }, "spec": { "selector": { "app": body.name }, "type": "ClusterIP", "ports": servicePorts } } })
  const ingress = ingresses.post({ body: { "apiVersion": "extensions/v1beta1", "kind": "Ingress", "metadata": { "name": `${body.name}-ingress`, "namespace": "default", "annotations": { "kubernetes.io/ingress.class": "traefik" } }, "spec": { "rules": [{ "host": `${body.name}.samuelstenton.com`, "http": { "paths": [{ "backend": { "serviceName": `${body.name}-service`, "servicePort": "web" } }] } }] } } });

  const res = await Promise.all([deployment, service, ingress]).catch(err => console.log(err))
  return success(callback, res);
}

const update = (event) => success()
const destroy = (event) => success()

/**
 * List current deployments within the cluster
 * @param {Object} event
 * @param {Object} context
 * @param {Function} callback
 */
const list = async (event, context, callback) => {
  const { body } = await ingresses.get()

  return success(callback, body.items);
}

/**
 * Return a success responce with data
 * @param {String} message 
 */
const success = (callback, message = 'Success') => (callback(null, {
  statusCode: 200,
    body: JSON.stringify({
      data: message
    }),
  }));

module.exports = { create, destroy, update, list }