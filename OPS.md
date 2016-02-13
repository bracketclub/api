tweetyourbracket-api OPS
=================

## Digital Ocean Setup on Ubuntu 14.04

Most of this is culled from this [tutorial](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-14-04) with some Postgres bits thrown in from [here](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-postgresql-on-ubuntu-14-04) and [here](https://www.digitalocean.com/community/tutorials/how-to-use-roles-and-manage-grant-permissions-in-postgresql-on-a-vps--2). Also instructions for getting postgres 9.5 were taken [from here](http://blog.chaps.io/2016/02/08/upgrading-postgresql-from-9-4-to-9-5-on-ubuntu-15-10.html). Also getting [automatic security updates](https://help.ubuntu.com/community/AutomaticSecurityUpdates).

The first tutorial has been modified so it only needs one droplet.

### API Droplet

```sh
# Need to install postgres 9.5
echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/postgres.list
sudo apt-get install wget ca-certificates
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install git nginx unattended-upgrades postgresql-9.5

# Turn on auto security updates
sudo dpkg-reconfigure --priority=low unattended-upgrades

# Install node
cd ~
wget https://nodejs.org/dist/v5.4.0/node-v5.4.0-linux-x64.tar.gz

mkdir node
tar xvf node-v*.tar.gz --strip-components=1 -C ./node

cd ~
rm -rf node-v*

mkdir node/etc
echo 'prefix=/usr/local' > node/etc/npmrc

sudo mv node /opt/
sudo chown -R root: /opt/node

sudo ln -s /opt/node/bin/node /usr/local/bin/node
sudo ln -s /opt/node/bin/npm /usr/local/bin/npm

# Create user account
sudo useradd -d /home/tweetyourbracket -m tweetyourbracket
sudo adduser tweetyourbracket sudo
sudo passwd tweetyourbracket

# Create postgres user/db
sudo su - postgres
createuser tweetyourbracket
createdb tweetyourbracket
psql
ALTER USER tweetyourbracket WITH PASSWORD 'ENTER_THE_PASSWORD';
exit

# Install api
sudo su - tweetyourbracket
git clone https://github.com/tweetyourbracket/api.git
cd api/
npm install

# Create config
cp config/default.json config/production.json
nano config/production.json
# Add values for twitter auth, postgres connection

# Seed postgres
exit
sudo su - postgres
psql -d tweetyourbracket -f /home/tweetyourbracket/api/sql/tweetyourbracket.sql
exit

# Setup pm2
sudo su - tweetyourbracket
sudo npm install -g pm2
pm2 statup ubuntu # only the first time
NODE_ENV=production pm2 start index.js -i 0 --name "api"
# NODE_ENV=production TYB_SPORT=ncaam TYB_YEAR=2016 pm2 start watchers/entry.js -i 0 --name "ncaam-entries"
# NODE_ENV=production TYB_SPORT=ncaam TYB_YEAR=2016 pm2 start watchers/score.js -i 0 --name "ncaam-scores"
# NODE_ENV=production TYB_SPORT=ncaaw TYB_YEAR=2016 pm2 start watchers/entry.js -i 0 --name "ncaaw-entries"
# NODE_ENV=production TYB_SPORT=ncaaw TYB_YEAR=2016 pm2 start watchers/score.js -i 0 --name "ncaaw-scores"

# Later
pm2 restart api
pm2 logs api
pm2 stop api

# Setup nginx
sudo apt-get update
sudo apt-get install nginx
sudo vi /etc/nginx/sites-available/default # see below for config
sudo service nginx restart
```

**/etc/nginx/sites-available/default**
```
server {
    listen 80;

    server_name DROPLET_PUBLIC_IP;

    location / {
        proxy_pass http://localhost:API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
