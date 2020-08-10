bc-api
=================

The API for [bracket.club](https://bracket.club).

[![Build Status](https://travis-ci.org/bracketclub/api.svg?branch=master)](https://travis-ci.org/bracketclub/api)

https://bracketclub.herokuapp.com

### Routes

**Users**
- `/users/:id`
- `/users/:id/:sport-:year`

**Entries**
- `/entries/:sport-:year`
- `/entries/:id`

**Masters**
- `/masters/:sport-:year`


### Starting the API

**Locally**

```sh
npm install
npm start
```

**Production**

```sh
# Make sure the DATABASE_URL secret exists in the .env file
touch .env
echo "DATABASE_URL=<TOTES_SECRET_CONN_STRING>" >> .env

# Deploy to bc-api
`git push heroku master`
Or push to GitHub, since automatic deploys are enabled.

### Exporting Data

By default this will use variables from `getconfig` and write data to the `.export` dir in this repo. This only ones a request for each database object and saves it to a directory with a standard naming structure. *The API server will need to be running for the requests to be successful.*

**Development**

```sh
npm start # From a separate window
npm run export
```

**Production**

```sh
# Assuming to server is running at `config.baseUrl`
NODE_ENV=production npm run export
```
