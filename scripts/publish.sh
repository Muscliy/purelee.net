scp ./dist.zip root@purelee.net:/home/dist.zip
ssh root@purelee.net '\
cd /usr/share/nginx/html \
&& sudo cp /home/dist.zip /usr/share/nginx/html/dist.zip \
&& sudo rm -rf dist || true \
&& sudo unzip dist.zip \
&& sudo cp -r dist/* www'