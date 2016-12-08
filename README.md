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
# Make sure the POSTGRES_URL env var is set
now secret add postgres-url TOTES_SECRET_CONNECTION_STRING
now -e POSTGRES_URL=@postgres-url
now
```
