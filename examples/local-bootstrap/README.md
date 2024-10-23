# Topology Protocol Example

This is an example of Topology Protocol usage in a local environment after a user has run a custom bootstrap node and tries to connect it and test the chat room system.

## How to run locally

After cloning the repository, run the following commands:

```bash
cd ts-topology/examples/local-env/chat
yarn
yarn build
yarn dev
```


In your browser, open the URL displayed in the terminal. You will see a form to connect to the bootstrap node. Copy the `peerId` from the terminal where you started the node and paste it in the form. Click "Connect".
By default, the bootstrap node is running on `127.0.0.1:50000` using `ws` but you can change these values and connect to your node.


Debugging is made easier by setting the mode in `webpack.config.js` to "development":

```js
module.exports = {
  mode: "development",
  ...
}
```

