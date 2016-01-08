tweetyourbracket-api
=================

### Routes

**Users**
- `/users`
- `/users/:id`

**Entries**
- `/entries?year&user`
- `/entries/:id`

**Masters**
- `/masters?year`


### Local

```sh
npm install
npm run local
```


### Setup
- Update + git
```sh
sudo apt-get update
sudo apt-get install git
```

- Install node v5.4.0

```sh
# https://gist.github.com/isaacs/579814#file-node-and-npm-in-30-seconds-sh
echo 'export PATH=$HOME/local/bin:$PATH' >> ~/.bashrc
. ~/.bashrc
mkdir ~/local
mkdir ~/node-latest-install
cd ~/node-latest-install
curl http://nodejs.org/dist/v5.4.0/node-v5.4.0.tar.gz | tar xz --strip-components=1
./configure --prefix=~/local
make install # ok, fine, this step probably takes more than 30 seconds...
curl https://www.npmjs.org/install.sh | sh
```

- Install npm v3
```sh
# This is for latest
curl -L https://npmjs.org/install.sh | sh
```

- Install api
```sh
git clone https://github.com/tweetyourbracket/api.git
cd api/
npm install
mkdir config
touch config/production.json
nano config/production.json # Add the values needed
npm run start
# npm run start -- --tweets --scores
```
