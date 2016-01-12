tweetyourbracket-api OPS
=================

## Digital Ocean Setup on Ubuntu 14.04

Most of this is culled from this [tutorial](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-14-04) with some Postgres bits thrown in from [here](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-postgresql-on-ubuntu-14-04) and [here](https://www.digitalocean.com/community/tutorials/how-to-use-roles-and-manage-grant-permissions-in-postgresql-on-a-vps--2).

**Create two Ubuntu 14.04 droplets with private networking.** If they aren't created originally with private networking then the `curl` command to get the private IP of the API droplet will fail. Even if you turn on private networking later, this command will still fail and you'll need to recreate the droplet from scratch.

### API Droplet

```sh
sudo apt-get update
sudo apt-get install git postgresql postgresql-contrib

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

# Get private IP
curl -w "\n" http://169.254.169.254/metadata/v1/interfaces/private/0/ipv4/address

# Create config
cp config/default.json config/production.json
nano config/production.json
# Add values for twitter auth, postgres connection, and private IP/port

# Seed postgres
exit
sudo su - postgres
psql -d tweetyourbracket -f /home/tweetyourbracket/api/sql/tweetyourbracket.sql
exit

# Setup pm2
sudo su - tweetyourbracket
sudo npm install -g pm2
pm2 statup ubuntu
NODE_ENV=production pm2 start index.js -i 0 --name "api"
# NODE_ENV=production pm2 start lib/entry.js -i 0 --name "entries"
# NODE_ENV=production pm2 start lib/scores.js -i 0 --name "scores"

# Later
pm2 restart api
pm2 logs api
pm2 kill api
```

### Web Droplet

```sh
sudo apt-get update
sudo apt-get install nginx
sudo vi /etc/nginx/sites-available/default
sudo service nginx restart
```

**/etc/nginx/sites-available/default**
```
server {
    listen 80;

    server_name WEB_DROPLET_PUBLIC_IP;

    location / {
        proxy_pass http://API_DROPLET_PRIVATE_IP:API_DROPLET_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
