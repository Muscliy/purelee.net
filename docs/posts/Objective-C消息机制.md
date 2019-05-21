---
title: Objective-C消息机制
lang: zh-CN
image: https://picsum.photos/1920/1080/?random&date=2015-12-07
date: 2015-12-07
tags:
  - NSFoundation
  - Objective-C
categories:
  - iOS
meta:
  - name: description
    content: 在OC 中给nil发送一个消息是不会发生任何事情了，但是给一个object发送一个没有定义实现的消息是回发生crash。
---

在OC 中给nil发送一个消息是不会发生任何事情了，但是给一个object发送一个没有定义实现的消息是回发生crash。

<!--more -->

```js
*** Terminating app due to uncaught exception 'NSInvalidArgumentException', reason: '-[Son name]: unrecognized selector sent to instance
```
在OC中，调用一个对象的方法，实际上是给对象发了一条消息，在编译Objective－C函数调用的语法时，会被翻译成一个C的函数调用：objc_msgSend(),例如：

```js
[jeep name];
objc_msgSend(jeep, @selector(name));
```
objc_msgSend主要做了下面几件事情：

- 通过object的isa指针找到它的class
- 在class的method_list中找到name
- 如果class中没找到name，则继续往他的superclass中查找
- 一旦找到name这个函数，就去执行对应的方法实现(IMP)
- 如果一直没有找到name,OC的runtime将会做消息转发：
那么先看转发之前，runtime的消息怎么处理。

## Class 和 Metaclass
---
关于class有很多写runtime文章中已经介绍过了，这里就不在做runtime部分的知识扩展，那么Metaclass 是什么鬼？
每一个Objective-C类也是一个对象。他也有一个isa指针和其他的数据，和可以相应的选择器。当你调用一个“类方法的时候”例如[NSObject alloc]，确实是给类对象（不是类的实例对象）发送了一个消息。 既然类也是一个对象，它一定也是一个其他类的实例：原类。其实不难理解，一个Class中所有的实例方法是存在Class中（即“-”方法），而类方法是寄存在MetaClass中的（即“+”方法）。

关于上面这张图片很多地方都有出现，但是解释的不是很清楚，图中已经将class和meta class的关系也理的很清楚，meta class 对应的指针在 class结构体重，当一个实例对象给类发一个类消息的时候，需要通过calss找到他的isa地址，然后发送消息。图中最难解释的地方是右上的逻辑，一个meta class的super class 又是类中的class对象（这里的root class 是 NSObject）。这也是runtime的一个特殊机制，我们可以做一个实验去验证。
我们先给NSObject添加一个Category，然后构建一个Car类

```js
#import "NSObject+Extents.h"

@implementation NSObject (Extents)

- (void)foo
{
	NSLog(@"instance method foo");
}

@end

#import <Foundation/Foundation.h>

@interface Car : NSObject
- (void)foo;
+ (void)foo;
@end

@implementation Car
@end

int main(int argc, const char * argv[]) {
	@autoreleasepool {
	    // insert code here...
		Car *jeep = [[Car alloc] init];

		[Car foo];
		[jeep foo];
	}
    return 0;
}
```
其中打印结果

```js
2015-12-07 15:29:20.013 PTTest[79208:5109827] instance method foo
2015-12-07 15:29:20.014 PTTest[79208:5109827] instance method foo
```
[Car foo]在metaclass的方法list中没有找到对应的地址来处理消息，这时候就去找super class的方法list，当然在给super发消息的时候有objc_msgSendSuper方法来处理

```js
OBJC_EXPORT id objc_msgSendSuper(struct objc_super *super, SEL op, ...)
    __OSX_AVAILABLE_STARTING(__MAC_10_0, __IPHONE_2_0);
```
objc_super结构体重receiver就是self，

```js
/// Specifies the superclass of an instance.
struct objc_super {
    /// Specifies an instance of a class.
    __unsafe_unretained id receiver;

    /// Specifies the particular superclass of the instance to message.
#if !defined(__cplusplus)  &&  !__OBJC2__
    /* For compatibility with old objc-runtime.h header */
    __unsafe_unretained Class class;
#else
    __unsafe_unretained Class super_class;
#endif
    /* super_class is the first class to search */
};
```

如果category没有+（void）fun这个方法，那么就会先检查消息转发，如果没有转发成功就会造成crash。

## 消息转发
---
在一个oc实例对象收到一个未定义的消息，在crash之前系统会给我们第二次机会，这就是消息转发

```js
@interface Person : NSObject
- (void)name;
@end

@interface Car : NSObject
{
	Person *owner;
}
- (void)name;
@end

@implementation Car

@end
```
上述代码中有两个类，如果我们创建一个Car类的实例对象jeep，然后向jeep发送[jeep name]消息，这时候就会导致crash。在crash之前runtime中会发生下面方法的的调用

```js
方案一

* - (BOOL)resolveInstanceMethod:(SEL)sel (实例方法调用该函数)
* + (BOOL)resolveClassMethod:(SEL)sel
 (如果调用的是类方法接口调用该方法)

方案二

* - (id)forwardingTargetForSelector:(SEL)aSelector;

方案三

* -(NSMethodSignature *)methodSignatureForSelector:(SEL)aSelector;

* -(void)forwardInvocation:(NSInvocation *)anInvocation;
```

不知道这几个方法调用的顺序是什么样的，我们可以在car.m中全部实现一遍

```js
@implementation Car
+ (BOOL)resolveInstanceMethod:(SEL)sel
{
	NSLog(@"resolveInstanceMethod");
	return [super resolveInstanceMethod:sel];
}

- (id)forwardingTargetForSelector:(SEL)aSelector
{
	NSLog(@"forwardingTargetForSelector");
	return [super forwardingTargetForSelector:aSelector];
}

- (NSMethodSignature *)methodSignatureForSelector:(SEL)aSelector
{
	NSLog(@"methodSignatureForSelector");
	return [super methodSignatureForSelector:aSelector];
}

- (void)forwardInvocation:(NSInvocation *)anInvocation
{
	NSLog(@"forwardInvocation");
	[super forwardInvocation:anInvocation];
}

- (void)doesNotRecognizeSelector:(SEL)aSelector
{
	NSLog(@"doesNotRecognizeSelector");
	[super doesNotRecognizeSelector:aSelector];

}

@end


2015-11-25 18:02:52.384 PTTest[32107:2182361] resolveInstanceMethod
2015-11-25 18:02:52.385 PTTest[32107:2182361] forwardingTargetForSelector
2015-11-25 18:02:52.385 PTTest[32107:2182361] methodSignatureForSelector
2015-11-25 18:02:52.385 PTTest[32107:2182361] resolveInstanceMethod
2015-11-25 18:02:52.385 PTTest[32107:2182361] doesNotRecognizeSelector
2015-11-25 18:02:52.386 PTTest[32107:2182361] -[Car name]: unrecognized selector sent to instance 0x1002051d0selector sent to instance 0x100300200
```


unrecognized 最终是在的NSObject中的 doesNotRecognizeSelector中发生，下面是NSObject.mm中的源码

```js
// Replaced by CF (throws an NSException)
+ (void)doesNotRecognizeSelector:(SEL)sel {
    _objc_fatal("+[%s %s]: unrecognized selector sent to instance %p",
                class_getName(self), sel_getName(sel), self);
}

// Replaced by CF (throws an NSException)
- (void)doesNotRecognizeSelector:(SEL)sel {
    _objc_fatal("-[%s %s]: unrecognized selector sent to instance %p",
                object_getClassName(self), sel_getName(sel), self);
}
```
从打印结果可以看得出来

```js
2015-12-07 11:36:45.827 PTTest[78291:4984103] resolveInstanceMethod
2015-12-07 11:36:45.828 PTTest[78291:4984103] forwardingTargetForSelector
2015-12-07 11:36:45.828 PTTest[78291:4984103] methodSignatureForSelector
2015-12-07 11:36:45.828 PTTest[78291:4984103] forwardInvocation
```
消息转发转发，先调用方案一，如果方案一没有将消息转发成功然后进入方案二失败后转入方案三，失败后直接造成crash，基本流程图看下图

流程图

![](http://muscliy.github.io/images/2015-12-7-foward-method.png)
