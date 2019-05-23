zip -r dist.zip dist
scp ./dist.zip root@www.purelee.net:/home/dist.zip
ssh root@www.purelee.net '\
cd /usr/share/nginx/html \
&& sudo cp /home/dist.zip /usr/share/nginx/html/dist.zip \
&& sudo rm -rf dist || true \
&& sudo unzip dist.zip \
&& sudo cp -r dist/* www'

rm dist.zip
rm -rf dist
