tweetyourbracket-api
=================

The API for Tweet Your Bracket.

[![Build Status](https://travis-ci.org/tweetyourbracket/api.svg?branch=master)](https://travis-ci.org/tweetyourbracket/api)

https://tyb-api.now.sh

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
# Make sure the POSTGRES_URL secret exists
npm run now -- secret add postgres-url TOTES_SECRET_CONNECTION_STRING
# Make sure connection string ends with `?ssl=true`
npm run deploy
# If you're happy with the deploy
now run alias
# API is now accessible from https://tyb-api.now.sh
```

### Exporting Data

By default this will use variables from `getconfig` and write data to the `tweetyourbracket.com` client repo (which should be located as a sibling of this repo).

```
npm run export
```

If you wanted to export stuff from production:

```
NODE_ENV=production npm run export
```
