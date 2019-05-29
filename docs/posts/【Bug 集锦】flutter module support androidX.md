---
title: 【Bug 集锦】flutter module support androidX
lang: zh-CN
display: home
image: https://picsum.photos/1920/1080/?random&date=2019-05-29
date: 2019-05-29
tags:
  - Bug
categories:
  - Flutter
meta:
  - name: description
    content: 在现有项目中集成flutter模块，因为本地使用的Android SDK是28版本，flutter 生成的build.gradle然针对SDK 27并使用非AndroidX版本的库，这些库与针对SDK 28并使用AndroidX的项目会产生冲突。
---

在享有项目中集成flutter模块，因为本地使用的Android SDK是28版本，flutter 生成的build.gradle然针对SDK 27并使用非AndroidX版本的库，这些库与针对SDK 28并使用AndroidX的项目会产生冲突。

<!-- more -->

![](http://ww1.sinaimg.cn/large/006tNc79ly1g3hzoja8ooj318w0qkq7z.jpg)

**错误提示**

```js
FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':app:preDebugBuild'.
> Android dependency 'com.android.support:animated-vector-drawable' has different version for the compile (27.1.1) and runtime (28.0.0) classpath. You should manually set the same version via DependencyResolution

* Try:
Run with --stacktrace option to get the stack trace. Run with --info or --debug option to get more log output. Run with --scan to get full insights.

* Get more help at https://help.gradle.org

BUILD FAILED in 4s
```

起初我们是通过修改flutter sdk中生成gradle的tpl来修正这个问题，但是google的产品怎么可能对google自己的产品支持度这么差。最后通过下面方法就可以解决了：在pubspec.yaml文件的module部分添加一个AndroidX的标记

```js
flutter:
  uses-material-design: true

  module:
    androidX: true
    androidPackage:
    iosBundleIdentifier:
````
