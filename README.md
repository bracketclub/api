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

### DO Setup on Ubuntu [14.04](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-14-04)

- Create two Ubuntu 14.04 droplets with private networking

**API Droplet**
```sh
sudo apt-get update
sudo apt-get install git

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

# Install api
git clone https://github.com/tweetyourbracket/api.git
cd api/
npm install
mkdir config
touch config/production.json


# Install postgres
cd ~

sudo useradd -d /home/tweetyourbracket -m tweetyourbracket
sudo passwd tweetyourbracket

sudo apt-get install postgresql postgresql-contrib
sudo su - postgres


createdb tweetyourbracket
psql -d tweetyourbracket -f api/sql/tweetyourbracket.sql

# Get private IP
curl -w "\n" http://169.254.169.254/metadata/v1/interfaces/private/0/ipv4/address
nano config/production.json # Add the values needed

# Setup pm2 and start
npm run pm2:ubuntu # Run command from output
npm run pm2:start
# npm run pm2:start -- --tweets --scores
```

**Web Droplet**
```sh

sudo apt-get update
sudo apt-get install nginx
sudo vi /etc/nginx/sites-available/default

# server {
#     listen 80;
# 
#     server_name WEB_DROPLET_PUBLIC_IP;
# 
#     location / {
#         proxy_pass http://API_DROPLET_PRIVATE_IP:API_DROPLET_PORT;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_cache_bypass $http_upgrade;
#     }
# }

sudo service nginx restart
```
