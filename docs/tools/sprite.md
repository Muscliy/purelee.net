---
title: 开发小技巧之sprite
lang: zh-CN
image: https://picsum.photos/1920/1080/?random&date=2018-02-12
date: 2018-01-31
tags:
  - tool
  - animation
categories:
  - efficient
meta:
  - name: description
    content: 使用Texture Packer制作动画贞雪碧图，可以大大提高我们在动画编程的效率，
---
做过iOS+Cocos2D或Android游戏开发，或者前端开发中，我们经常做一些复杂的动画会应用到雪碧图。举个栗子在网易云音乐的的年度总结中会有一个小人在弹guita的动画

<!-- more -->

![](http://upload-images.jianshu.io/upload_images/3876306-49c8c31643ccd2d3.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

这个动画是通过css 的animate结合雪碧图来实现的，下面的小人的雪碧图

![](http://upload-images.jianshu.io/upload_images/3876306-5a8b7bef2880add4.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

在翻看它的实现代码，你真的是想说 我的天

```css
@-webkit-keyframes guitaSittingAnimation {
  0% {
    background-position: 0px 0px;
  }
  1.69% {
    background-position: -89px 0px;
  }
  3.39% {
    background-position: -178px 0px;
  }
  5.08% {
    background-position: -267px 0px;
  }
  ......
```

看到上面的代码要是自己硬编码让你写，你心中是万头草泥马，都是体力活

![](http://upload-images.jianshu.io/upload_images/3876306-116ac694b7121392.jpeg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

接下来说怎么快速有效的解决这个问题。

### Step1

首先让UI通过AE cc将需要展示的动画的每一帧导出单独的图片给你

![](http://upload-images.jianshu.io/upload_images/3876306-acf3f3c18597eace.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

### Step2

神器上场 Texture Packer

![](http://upload-images.jianshu.io/upload_images/3876306-11f7fe961dbae8ba.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
![](http://upload-images.jianshu.io/upload_images/3876306-ba4027898009e77b.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

关于你具体怎么使用（此处省略1000字吧）最重要的是下图中的两个步骤：选择Output中的Data format为css 然后 publish下

![](http://upload-images.jianshu.io/upload_images/3876306-5b8d4192e8141393.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

最后你会在生成的文件中找到.png 和 .css文件，看见css文件，你想想都开心（不！是惊喜）它会给我们生成具体的每一帧图片所在的位置。

```css
/* ----------------------------------------------------
   created with http://www.codeandweb.com/texturepacker
   ----------------------------------------------------
   $TexturePacker:SmartUpdate:dacea035d4dd4d6665055188849b8088:1/1$
   ----------------------------------------------------

   usage: <span class="{-spritename-} sprite"></span>

   replace {-spritename-} with the sprite you like to use

*/

.sprite {display:inline-block; overflow:hidden; background-repeat: no-repeat;background-image:url(Untitled.png);}

.00 { background-position: -2px -2px}
.01 { background-position: -754px -2px}
.02 { background-position: -1506px -2px}
.03 { background-position: -2258px -2px}
.04 { background-position: -3010px -2px}
.05 { background-position: -3762px -2px}
.06 { background-position: -4514px -2px}
.07 { background-position: -5266px -2px}
.08 { background-position: -6018px -2px}
```

### Step3

​	Step2好像并不是我们想要的结果，我们需要的做动画的时候通过百分比来控制。接下来找到一个css计算器

![](http://upload-images.jianshu.io/upload_images/3876306-b7d3cf5b7a34856a.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

比如我的一个动画周期需要跑74帧, 就可以借助它来帮助我们生成算百分比。

### Step4

```
.00 { background-position: -2px -2px}

0%{  /* 动作1 */  }
```

将这两个数据要合并成
```
0%{   background-position: -2px -2px }
```
这时候就要用到我们的开发工具了，sublime中的多行编辑功能可以方便的解决

![](http://upload-images.jianshu.io/upload_images/3876306-54a50697e1d39dc5.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
