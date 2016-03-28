tweetyourbracket-api OPS
=================

## Digital Ocean Setup on Ubuntu 14.04

**[Initial server setup](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-14-04)**

Most of this is culled from this [tutorial](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-14-04) with some Postgres bits thrown in from [here](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-postgresql-on-ubuntu-14-04) and [here](https://www.digitalocean.com/community/tutorials/how-to-use-roles-and-manage-grant-permissions-in-postgresql-on-a-vps--2). Also instructions for getting postgres 9.5 were taken [from here](http://blog.chaps.io/2016/02/08/upgrading-postgresql-from-9-4-to-9-5-on-ubuntu-15-10.html). Also getting [automatic security updates](https://help.ubuntu.com/community/AutomaticSecurityUpdates). Also [SSL](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-14-04).

The first tutorial has been modified so it only needs one droplet.

### DO Droplet

```sh
# Need to install postgres 9.5
echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/postgres.list
sudo apt-get install wget ca-certificates
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install git bc nginx unattended-upgrades postgresql-9.5

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
psql -c "ALTER USER tweetyourbracket WITH PASSWORD 'ENTER_THE_PASSWORD'";
exit

# Install api
sudo su - tweetyourbracket
git clone git@bitbucket.org:lukekarrys/api.git
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

# npm run-scripts to start things using pm2
npm run pm2:start -- --only api
# npm run pm2:start -- --only entries:ncaam
# npm run pm2:start -- --only entries:ncaaw
# npm run pm2:start -- --only scores:ncaam
# npm run pm2:start -- --only scores:ncaaw

# Later
npm run pm2:restart -- --only api # or (entries|scores)-ncaa(m|w)
npm run pm2:stop -- --only api
npm run pm2:delete -- --only api
npm run pm2:logs -- --only api

# Setup nginx
sudo apt-get update
sudo apt-get install nginx

sudo git clone https://github.com/letsencrypt/letsencrypt /opt/letsencrypt
cd /opt/letsencrypt
./letsencrypt-auto certonly --standalone
# api.tweetyourbracket.com

sudo nano /etc/nginx/sites-available/default # see nginx/default for config
sudo service nginx restart
```
