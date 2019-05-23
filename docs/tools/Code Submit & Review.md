---
title: Code Submit & Review
lang: zh-CN
display: home
image: https://picsum.photos/1920/1080/?random&date=2016-07-22
date: 2016-07-22
tags:
  - Tool
categories:
  - Team
meta:
  - name: description
    content: phabricator集成了一系列开源的Web应用程序，用以帮助软件公司开发更好的软件。
---

phabricator集成了一系列开源的Web应用程序，用以帮助软件公司开发更好的软件。

<!-- more -->

## 安装arcanist
---
[Arcanist Quick Start](https://secure.phabricator.com/book/phabricator/article/arcanist/ )

日常代码提交操作
克隆远端仓库到本地

```js
git clone git@xxx:xxx.git
```

开发与代码提交
先和服务器端代码同步
```js
git pull --rebase
```

创建分支
```js
git checkout -b 分支名 origin/master
```

比如要完成两个任务，一个是 订单退回，一个是 修改消息发送错误，那么推荐创建两个本地branch：

```js
git checkout -b OrderRefund origin/master
git checkout -b FixSendMsgError origin/master
```

(建议将上面的 git checkout -b 做成 alias，这样只主要打 gcb OrderRefund origin/master)

然后在相应分支上去处理对应的任务
相当于老师给你布置了语文作业和数学作业,你要在语文作业本上去写语文作业,数学作业本上去写数学作业..

将写完的代码commit(提交)到本地并diff到Phabricator上

```js
git add .
git commit -m "xxx"
```
```js
arc diff  // 将本次commit 发送给Phabricator
```
然后在弹出的界面里，写好 title，summary，test plan 和 manifest task id（如果有的话）

arc diff时会提示让你指定
Reviewers,意思是本次diff能让谁进行审核
你必须指定至少一人来审核你的本次提交,例如你的项目负责人,在Phabricator平台的"People"栏目里可以看到所有成员的名字
diff之后,就等待Reviewer审核吧...
这里就相当于老师给你布置了语文作业,你写好之后commit并diff给老师批阅//

## 未通过审核
---

在Phabricator 的 Differential栏目里,可以看到你diff上来的内容,同时也可看到管理员给你代码的批注,根据批注去修改你本地的代码,然后再次提交:

根据批注修改好代码后

```js
git commit -a --amend
```

注意这里要带上amend参数,把本次改动更新到上一次的commit

```js
arc diff
```

>  这里arc会track本地commit里已经挂接上的diff id，然后更新之前生成过的diff。
这里就相当于你commit了你的语文作业后,老师批阅你作业时发现有很多问题,打回来让你别回家修改问题作业
diff之后,再次等待Reviewer的审核.... 这样循环下去,直到你的Reviewer Accept了你的diff

## 通过审核,push!
---

在Differential栏目里,如果Reviewer Accept了你的diff,你就可以把本次commit push到远程仓库上了

```js
arc amend;
git push origin master
```
如果遇到远端的git repository有更新还无法push的情况，则先pull rebase一次：
```js
git pull --rebase
```

如果需要reviwer take over这个diff

在Diff最下方的commit栏目里,选择Commandeer Revision，就表示这个diff将由你接管，然后在local branch上执行

```js
arc patch --nobranch DXXX(Diff ID)
```
就可以把这个Diff同步到本地了。
