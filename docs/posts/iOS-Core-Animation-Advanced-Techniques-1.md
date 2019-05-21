---
title: iOS Core Animation Advanced Techniques (一)
lang: zh-CN
image: https://picsum.photos/1920/1080/?random&date=2016-01-19
date: 2016-01-19
tags:
  - Animation
  - Objective-C
categories:
  - iOS
meta:
  - name: description
    content: 在iOS界面开发中离不开UIView(视图), 所有的可视化控件基本继承来自UIView，UIView就是在屏幕上显示的一个矩形块(比如文字、图片、视频)。
---
这只是一篇看完《iOS Core Animation Advanced Techniques》书的一个摘要，并不是一篇翻译，书籍的可读性非常高，很多基础不扎实的iOS 开发者都缺少的一块知识的补充。
在iOS界面开发中离不开UIView(视图), 所有的可视化控件基本继承来自UIView，UIView就是在屏幕上显示的一个矩形块(比如文字、图片、视频)。可以处理触摸时间，可以支持CoreGraphics绘图，可以做动画。

<!-- more -->

CALayer(图层)在概念上和UIView类似，同样是一些被层级关系管理的矩形块，同样也可以包含(比如文字、图片、视频)这些信息。和UIView最大的不同就是不能处理用户的交互

## UIView和CALayer的关系

每一个UIView 都有一个CALayer，从代码的角度来分析，应该是试图管理者图层，所有的UIView的动画其实CALayer才是真正的始作俑者，UIView仅仅只是对它的一个封装，而UIView知识体统了iOS中处理触摸的具体功能，还有Core Animation底层方法的高级接口。在MAC开发中我们用的NSView也是如此，那么苹果为什么要在两个不同平台上去封装两个不同类，这主要是试图对用户的动作处理的区别，UIView处理的主要是用户多点触控，NSView处理的是针对对电脑键盘和鼠标的事件。

## CALayer的能力
**contents**
contents的属性类型是id，也就意味着他可以是任何类型的对象，比如我们需要给一个layer设置一张图片的时候就可以使用下面的方式

```js
/* An object providing the contents of the layer, typically a CGImageRef,
 * but may be something else. (For example, NSImage objects are
 * supported on Mac OS X 10.6 and later.) Default value is nil.
 * Animatable. */

layer.contents = (__bridge id)image.CGImage;
```
因为cocoa部分是支持apple跨平台的，UIImage知识基于iOS系统给CGImage分装的类，但是CGImageRef并不是一个真正的Cocoa对象，而是一个Core Foundation类型，，如果你没有使用ARC模式，就不需要转换，如果是ARC模式他们之间可以通过__bridge来转换。

**contentGravity**
```js
/* A string defining how the contents of the layer is mapped into its
 * bounds rect. Options are `center', `top', `bottom', `left',
 * `right', `topLeft', `topRight', `bottomLeft', `bottomRight',
 * `resize', `resizeAspect', `resizeAspectFill'. The default value is
 * `resize'. Note that "bottom" always means "Minimum Y" and "top"
 * always means "Maximum Y". */
 ```

这个和UIImageView 的contentMode 是一样的。下面对照图片可以看出来

![](http://muscliy.github.io/images/2016-1-15-iOS-Core-Animation-1-1.png)

![](http://muscliy.github.io/images/2016-1-15-iOS-Core-Animation-1-2.png)

**contentsScale**

控制backing image(寄宿图) 的像素和试图大小的比例，但是他总不会寄宿图有影响，如果你尝试的改变他的值，如果你设置了contentsGravity 属性为(resize',resizeAspect’, `resizeAspectFill’) ，那么你会发现根本没有起到任何的作用。但是并不代表放大图片就走不通了，还可以通过transform和affineTransform 属性来达到这个目的。在后面会详细做介绍。

contentsScale 设置为1.0， 试图将会以每个点1个像素值来绘制图片，如果是2.0，就会按照每个点2个像素来绘制图片了，这就是我们所说的Retina屏幕和非Retain图片的区别了。Paintcode网站上这篇博文说的不错 iphone-6-screens-demystified

因为contentsScale defaults in one 将contentsGravity 设置为center，那么我们做小面的对比，scale分别是1.0，2.0，3.0

![](http://muscliy.github.io/images/2016-1-15-iOS-Core-Animation-1-3.png)
![](http://muscliy.github.io/images/2016-1-15-iOS-Core-Animation-1-4.png)
![](http://muscliy.github.io/images/2016-1-15-iOS-Core-Animation-1-5.png)

如果你要根据当前屏幕分辨率放大倍数来给contentScale赋值的话，代码如下

```js
layer.contentsScale = [UIScreen mainScreen].scale;
```

**maskToBounds**

这个属性在我们设置试图的圆角的时候会用的。masksToBounds还有个功能是和UIView中的clipsToBounds 功能是一样的，它用来决定是否显示超出图层显示范围的内容。


**contentsRect**

contentsRect可以让我们只显示寄宿图片的一部分，可以控制图片是怎么显示和拉伸的。默认值是{0, 0, 1, 1}，如果我们想要指定一个小一点的矩形图片显示区域，图片就会像下图一样被裁减

![](http://muscliy.github.io/images/2016-1-15-iOS-Core-Animation-1-6.png)

当然你可以设置大于{1，1}的尺寸，这样的话图片占图层的区域会小一点。这个功能在游戏图片拼合上面用处比较大。

**contentsCenter**
这个属性的命名方式个人觉得在apple中是不合理的，起初我以为是一个pointer。没想到是一个CGRect类型，它的作用是指定图层可拉伸的区域。效果和UIImage里的- resizableImageWithCapInsets: 方法效果非常类似

![](http://muscliy.github.io/images/2016-1-15-iOS-Core-Animation-1-7.png)
![](http://muscliy.github.io/images/2016-1-15-iOS-Core-Animation-1-8.png)

```js
@interface ViewController ()
@property (nonatomic, weak) IBOutlet UIView *button1;
@property (nonatomic, weak) IBOutlet UIView *button2;
@end
@implementation ViewController
- (void)addStretchableImage:(UIImage *)image
          withContentCenter:(CGRect)rect
                    toLayer:(CALayer *)layer {
  // set image
  layer.contents = (__bridge id)image.CGImage;

  // set contentsCenter
  layer.contentsCenter = rect;
}

- (void)viewDidLoad {
  [super viewDidLoad];

  // load button image
  UIImage *image = [UIImage imageNamed:@"Button.png"];

  // set button 1
  [self addStretchableImage:image
          withContentCenter:CGRectMake(0.25, 0.25, 0.5, 0.5)
                    toLayer:self.button1.layer];

  // set button 2
  [self addStretchableImage:image
          withContentCenter:CGRectMake(0.25, 0.25, 0.5, 0.5)
                    toLayer:self.button2.layer];
}

@end
```

**Custom Drawing**
给一个layer设置一张寄宿图片，除了contents设置CGImage的方法外，当然还可以用Core Graphics直接绘制寄宿图，通过继承UIView并实现 -drawRect:方法来自定义绘制。

-drawRect: 方法没有默认的实现，因为对UIView来说，寄宿图并不是必须的，它不在意那到底是单调 的颜色还是有一个图片的实例。如果UIView检测到 -drawRect: 方法被调用了，它就会为视图分配一个寄 宿图，这个寄宿图的像素尺寸等于视图大小乘以 contentsScale 的值。

如果你不需要展示寄宿图的话就不要重构这方法，它会造成CPU资源和内存的浪费，apple公司的文档也是这么建议的：
```js
method in your layer subclasses if you don’t intend to do any custom drawing.

```

虽然-drawRect: 方法是UIView方法，事实上都是底层CALayer安排重绘工作和保存因此产生的图片。

当然CALayer也是有自己重绘的方式的，CALayer有一个delegate属性，实现了CALayerDelegate协议，这是一个非正式协议，你只需要调用非正式协议（类别中方法）CALayer就会帮你做剩下的事情了。

当需要重绘的时候，CALayer会请求他的代理给他一个寄宿图来显示，通过下面方法来实现

```js
- (void)displayLayer:(CALayer *)layer
```
如果没有实现上面方法，CALayer会去尝试调用下面这个方法

```js
- (void)drawLayer:(CALayer *)layer inContext:(CGContextRef)ctx
```

实现CALayerDelegate

```js
- (void)viewDidLoad {
  [super viewDidLoad];

  _blueView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 200, 200)];
  _blueView.center = CGPointMake(CGRectGetWidth(self.view.bounds) / 2.0,
                                 CGRectGetHeight(self.view.bounds) / 2.0);
  _blueView.backgroundColor = [UIColor whiteColor];
  [self.view addSubview:_blueView];

  CALayer *blueLayer = [[CALayer alloc] init];
  blueLayer.frame = CGRectMake(50, 50, 100, 100);
  blueLayer.contentsScale = [UIScreen mainScreen].scale;
  blueLayer.backgroundColor = [UIColor blueColor].CGColor;
  blueLayer.delegate = self;
  [_blueView.layer addSublayer:blueLayer];
  [blueLayer display];
}

#pragma mark - CALayerDelegate

//- (void)displayLayer:(CALayer *)layer {
//}

- (void)drawLayer:(CALayer *)layer inContext:(CGContextRef)ctx {
  CGContextSetLineWidth(ctx, 5.0);
  CGContextSetStrokeColorWithColor(ctx, [UIColor redColor].CGColor);
  CGContextStrokeEllipseInRect(ctx, layer.bounds);
}
```
![](http://muscliy.github.io/images/2016-1-15-iOS-Core-Animation-1-9.png)
