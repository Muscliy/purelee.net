---
title: Effective Objective-C 2.0 笔记(一)
lang: zh-CN
image: https://picsum.photos/1920/1080/?random&date=2015-12-11
date: 2015-12-11
tags:
  - Standard
  - Objective-C
categories:
  - iOS
meta:
  - name: description
    content: Obejctive-C通过一套全新的语法，在C语言基础上添加了面向对象特性。Objectice-C的语法中频繁使用方括号，而且不吝于写出极长的方法名，这通常令许多人觉得此语言较为冗长。其实这样写出来的代码十分易读，只是C++或者Java程序员不太适应。
---

Obejctive-C通过一套全新的语法，在C语言基础上添加了面向对象特性。Objectice-C的语法中频繁使用方括号，而且不吝于写出极长的方法名，这通常令许多人觉得此语言较为冗长。其实这样写出来的代码十分易读，只是C++或者Java程序员不太适应。
Objective-C语言学起来很快，但有很多微妙细节需要注意，而且还有许多容易为人所忽略的特性。

<!-- more -->

## Objective-C 变量、对象、结构
```
NSString *someString = @"the string";
someString : 变量
@"the string" : 实例 也是对象
```

变量是指向NSString的指针，变量内存分配在“栈”上，对象内存分配在“堆”上，结构体的内存分布在“数据块”中（CGRect,如果改用对象，性能会受影响）

## 在类的头文件中尽量减少引用其他头文件

- 减轻编译的负担
- 使用@class Employer（向前声明 ）的方法

## 多用字面量意思的方法对变量赋值

For example:

```js
NSArray *names = @[@"Brian", @"Matt", @"Chris", @"Alex", @"Steve", @"Paul"];
NSDictionary *productManagers = @{@"iPhone" : @"Kate", @"iPad" : @"Kamal", @"Mobile Web" : @"Bill"};
NSNumber *shouldUseLiterals = @YES;
NSNumber *buildingZIPCode = @10018;
```
Not:
```js
NSArray *names = [NSArray arrayWithObjects:@"Brian", @"Matt", @"Chris", @"Alex", @"Steve", @"Paul", nil];
NSDictionary *productManagers = [NSDictionary dictionaryWithObjectsAndKeys: @"Kate", @"iPhone", @"Kamal", @"iPad", @"Bill", @"Mobile Web", nil];
NSNumber *shouldUseLiterals = [NSNumber numberWithBool:YES];
NSNumber *buildingZIPCode = [NSNumber numberWithInteger:10018];
```

## 多用类型常量、少用#define预处理指令

```js
#define ANIMTION_DURATION 0.3
static const NSTimeInterval kAnimationDuration = 0.3
```

define 相比常量的缺点

- 没有类型信息
- 预处理会将所有ANIMTION_DURATION 都处理成0.3，这样需要避免重命名

在Objective-c 中常量通常是局限在于某“编译单元”（translation unit 也是就是 实现文件中），则在前面加字母k，若常量在类之外可见，则通常需要以类名为前缀.比如我们Objective-C中的UIApplication类中就有很多对外可见的变量

UIApplication.h

```js
UIKIT_EXTERN NSString *const UIApplicationDidEnterBackgroundNotification       NS_AVAILABLE_IOS(4_0);
UIKIT_EXTERN NSString *const UIApplicationWillEnterForegroundNotification      NS_AVAILABLE_IOS(4_0);
UIKIT_EXTERN NSString *const UIApplicationDidFinishLaunchingNotification;
UIKIT_EXTERN NSString *const UIApplicationDidBecomeActiveNotification;
UIKIT_EXTERN NSString *const UIApplicationWillResignActiveNotification;
UIKIT_EXTERN NSString *const UIApplicationDidReceiveMemoryWarningNotification;
UIKIT_EXTERN NSString *const UIApplicationWillTerminateNotification;
UIKIT_EXTERN NSString *const UIApplicationSignificantTimeChangeNotification;
```

UIApplication.m

```js
NSString *const UIApplicationDidEnterBackgroundNotification = @"UIApplicationDidEnterBackgroundNotification";
NSString *const UIApplicationWillEnterForegroundNotification = @"UIApplicationWillEnterForegroundNotification";
NSString *const UIApplicationDidFinishLaunchingNotification = @"UIApplicationDidFinishLaunchingNotification";
NSString *const UIApplicationDidBecomeActiveNotification = @"UIApplicationDidBecomeActiveNotification";
NSString *const UIApplicationWillResignActiveNotification = @"UIApplicationWillResignActiveNotification";
NSString *const UIApplicationDidReceiveMemoryWarningNotification = @"UIApplicationDidReceiveMemoryWarningNotification";
NSString *const UIApplicationWillTerminateNotification = @"UIApplicationWillTerminateNotification";
```

此类变量需放在“全局符号表”中以便可以在定义常量的编译单元之外使用，还需要注意和static 和 const 位置的不同,此类常量必须要定义，而且只能定义一次，通常将其定义在与声明该常量的头文件相关的实现文件中。

## 枚举
- 用NS_ENUM 与 NS_OPTIONS宏来定义枚举类型，并指明其底层的数据类型
- 处理枚举类型的switch语句中不要实现default分支，这样的话，加入新枚举之后，编译器就会提示开发者：switch语句并没有处理所有枚举
