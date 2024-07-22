# Topology Protocol Example

This is an example of Topology Protocol usage in a chat system where a user can create or connect to a chat room and see all the messages sent in the group chat.

## Specifics

Messages are be represented as strings in the format (timestamp, content, senderId). Chat is a class which extends TopologyObject and has Gset\<string> as an attribute to store the list of messages.

## How to run locally

After cloning the repository, run the following commands:

```bash
cd TopologyExample
yarn install
yarn dev
```

Debugging is made easier by setting the mode in `webpack.config.js` to "development":

```js
module.exports = {
  mode: "development",
  ...
}
```
