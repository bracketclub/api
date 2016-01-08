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
ALTER USER tweetyourbracket WITH PASSWORD 'ENTER_THE_PASSWORD'; # User passwd for postgres connection
exit

# Install api
sudo su - tweetyourbracket
git clone https://github.com/tweetyourbracket/api.git
cd api/
npm install

# Get private IP for config host
curl -w "\n" http://169.254.169.254/metadata/v1/interfaces/private/0/ipv4/address

# Create config
mkdir config && nano config/production.json

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
# NODE_ENV=production pm2 start index.js --tweets --scores
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
