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
# Make sure the POSTGRES_URL secret is created (first time only)
npm run now -- secret add postgres-url TOTES_SECRET_CONNECTION_STRING
npm run now:deploy
# If you're happy with the deploy
now run now:alias
# API is now accessible from https://tybapi.now.sh
```
