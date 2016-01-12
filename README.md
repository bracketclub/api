tweetyourbracket-api
=================

### Routes

**Users**
- `/users`
- `/users/:id`

**Entries**
- `/entries?year`
- `/entries/:id`

**Masters**
- `/masters?year`


### Local Dev

```sh
npm install
cp config/default.json config/development.json
```

**API**
```sh
npm start
```

**Score watcher**
```sh
npm start:scores
```

**Entry watcher**
```sh
npm start:entries
```

### Deploying on Digital Ocean

See [OPS.md](./OPS.md).
