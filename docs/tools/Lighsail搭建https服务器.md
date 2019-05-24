---
title: Lighsail搭建https服务器
lang: zh-CN
display: home
image: https://picsum.photos/1920/1080/?random&date=2019-05-23
date: 2019-05-23
tags:
  - Https
  - Nginx
categories:
  - Server
meta:
  - name: description
    content: Amazon Lightsail 是一款轻量级的服务器，选择他做为我的入门server搭建是进过深思熟虑的，一方面是大厂产品，而且可以无限的为你的私有IP进行静态IP的分离与绑定(对ss速度没有多大洁癖的话，足够了)。另一方面便宜(3.5美元一个月)，还有安全的防火墙功能设置。
---
Amazon Lightsail 是一款轻量级的服务器，选择他做为我的入门server搭建是进过深思熟虑的，一方面是大厂产品，而且可以无限的为你的私有IP进行静态IP的分离与绑定(对ss速度没有多大洁癖的话，足够了)。另一方面便宜(3.5美元一个月)，还有安全的防火墙功能设置。

<!-- more -->

## SSH连接

1、下载SSH 密钥对

2、修改SSH秘钥对的权限

```js
chomd 666 LightsailDefaultPrivateKey-ap-northeast-1.pem
```

3、将秘钥对添加

```js
ssh-add -K LightsailDefaultKey-ap-northeast-1.pem
```



## 更改默认登录用户

我有洁癖喜欢将机器的默认用户，这样方便在后期写一些自动化部署脚本部署你服务

1、创建root的密码

```js
sudo passwd root
```

2、切换到root用户

```js
su
```

3、修改ssh 登录方式

```js
vi /etc/ssh/sshd_config
```

4、修改配置

```js
PermitRootLogin yes
PasswordAuthentication yes
```

5、重启

```js
reboot
```



## 配置https

 [Let's Encrypt](https://www.vpser.net/build/letsencrypt-certbot.html)是很火的一个免费SSL证书发行项目，自动化发行证书，证书有90天的有效期。适合个人使用或者临时使用，不用再忍受自签发证书不受浏览器信赖的提示。去年VPS侦探曾经说过[Let's Encrypt的使用教程](https://www.vpser.net/build/letsencrypt-free-ssl.html)，但是Let's Encrypt已经发布了新的工具[certbot](https://www.vpser.net/build/letsencrypt-certbot.html)，虽然是新的工具，但是生成证书的使用方法和参数是基本一致的，证书续期更简单了。但是目前看[certbot](https://www.vpser.net/build/letsencrypt-certbot.html)在一些老版本的Linux发行版上的兼容性还是有问题的，特别是在CentOS 5上因为python版本过低是无法用的，CentOS 6上需要先[安装epel](https://www.vpser.net/manage/centos-rhel-linux-third-party-source-epel.html)才行，当然也有很多第三方的工具你也可以自己去尝试一下。

如果使用lnmp1.4,1.5的话都自带了生成SSL的工具，直接执行 **lnmp ssl add** 添加或者 **lnmp vhost add** 添加域名时"add ssl certificate"启用并选择letsencrypt。

安装方式参照官网的方式撸一遍OK了,官网会根据不同的系统和不同的代理服务有不同的教程， 我选用的nginx和centos7

```js
$ yum -y install yum-utils
$ yum-config-manager --enable rhui-REGION-rhel-server-extras rhui-REGION-rhel-server-optional
$ sudo yum install certbot python2-certbot-nginx
$ sudo certbot --nginx certonly
```

接下来稍有不同，**如果您想使用Let's Encrypt的新ACMEv2服务器获取通配符证书，您还需要使用 Certbot的DNS插件之一**

```js
$ sudo certbot -a dns-plugin -i apache -d“* .domain.com”-d domain.com --server https://acme-v02.api.letsencrypt.org/directory
```

因为我的域名是在华云上申请的

```
sudo certbot certonly --standalone -d domain.com -d www.domain.com
```

在接下来的nginx.conf 中添加

```js
 ssl_certificate     /etc/letsencrypt/live/domain.com/cert.pem;
 ssl_certificate_key /etc/letsencrypt/live/domain.com/privkey.pem;
 ssl_trusted_certificate /etc/letsencrypt/live/domain.com/chain.pem;
```



**你以为这样就可以了吗？**

> 你可以到https://www.ssllabs.com/ssltest/index.html 这网站测试你的安全等级，这时候只能达到C，因为在移动设备上会出现错误，尤其是在旧设备上



## 完善HTTPS

执行以下命令

```js
openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048
```

在nginx.conf 中加入

```js
ssl_dhparam /etc/nginx/ssl/dhparam.pem;
```

SSLv3是有漏洞的，所以不应该启用，并启用启用向前保密。

```js
  ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
  ssl_prefer_server_ciphers on;
  ssl_dhparam /etc/ssl/certs/dhparam.pem;
  ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-R
SA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA';
  ssl_session_timeout 1d;
  ssl_session_cache shared:SSL:50m;
  ssl_stapling on;
  ssl_stapling_verify on;
  #add_header Strict-Transport-Security max-age=15768000;
```



## 强制HTTPS

如需强制只需要将80端口301到https

```js
server {
    listen 80;
    return 301 https://$host$request_uri;
}
```
