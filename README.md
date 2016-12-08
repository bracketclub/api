tweetyourbracket-api
=================

[![Build Status](https://travis-ci.org/tweetyourbracket/api.png?branch=master)](https://travis-ci.org/tweetyourbracket/api)

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
npm install now -g
# Make sure the POSTGRES_URL secret is created (should only need to be done once)
now secret add postgres-url TOTES_SECRET_CONNECTION_STRING
npm run deploy
# If you're happy with the deploy
now alias URL_FROM_CLIPBOARD tybapi
# API is now accessible from https://tybapi.now.sh
```
