tweetyourbracket-api
=================

### Routes

**Entries**
- `/entries`
- `/entries/:id`
- `/:year/entries`
- `/:year/entries/:id`

**Masters**
- `/masters`
- `/:year/masters`


### Setup
- Update + git
```sh
sudo apt-get update
sudo apt-get install git
```

- Install node v0.10.36

```sh
# https://gist.github.com/isaacs/579814#file-node-and-npm-in-30-seconds-sh
echo 'export PATH=$HOME/local/bin:$PATH' >> ~/.bashrc
. ~/.bashrc
mkdir ~/local
mkdir ~/node-latest-install
cd ~/node-latest-install
curl http://nodejs.org/dist/v0.10.36/node-v0.10.36.tar.gz | tar xz --strip-components=1
./configure --prefix=~/local
make install # ok, fine, this step probably takes more than 30 seconds...
curl https://www.npmjs.org/install.sh | sh
```

- Install npm v2.7.0 (or later probably)
```sh
# This is for latest
curl -L https://npmjs.org/install.sh | sh
```

- Install api
```sh
git clone https://github.com/tweetyourbracket/api.git
cd api/
npm install
touch config.json
nano config.json # Add the values needed
npm run tmux-start # or `npm run start-watchers`
```