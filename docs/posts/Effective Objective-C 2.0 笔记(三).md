---
title: Effective Objective-C 2.0 笔记(三)
lang: zh-CN
image: https://picsum.photos/1920/1080/?random&date=2015-12-13
date: 2015-12-13
tags:
  - Standard
categories:
  - Objective-C
meta:
  - name: description
    content: 我们在构建应用程序时，可能想将其中部分代码用于后续项目，也可能想把某些代码发布出去，供他人使用。即便现在还不想这么做，将来也总会有用到的时候。如果决定重用代码，那么我们在编写接口时就会将其设计成易于复用的形式。这需要用到Objective-C语言中常见的编程范式，同时还需要了解各种可能碰到的陷阱。
---

我们在构建应用程序时，可能想将其中部分代码用于后续项目，也可能想把某些代码发布出去，供他人使用。即便现在还不想这么做，将来也总会有用到的时候。如果决定重用代码，那么我们在编写接口时就会将其设计成易于复用的形式。这需要用到Objective-C语言中常见的编程范式，同时还需要了解各种可能碰到的陷阱。

<!-- more -->

近年来，开源社区与开源组件随着iOS开发流行起来，所以我们经常会在开发自己的应用程序市，使用他人所写的代码。与此同时，别人也会用到你写的代码，所以要把代码写得清晰一些，以便于其他开发者能够迅速而方便地将其集成到他们的项目里。

## 用前缀避免命名空间冲突
如果你写程序需要放到Github给别人用，那么所有的类名应该加前缀，前缀应该由3个大写字母组成，因为apple宣称其保留使用所有“两字母前缀”,比如之前有很多人用TW作为前缀，后来apple引入了TWRequest,请求调用Twitter API。

## 提供”全能初始化方法”

```js
@interface NSDate : NSObject <NSCopying, NSSecureCoding>

@property (readonly) NSTimeInterval timeIntervalSinceReferenceDate;

- (instancetype)init NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithTimeIntervalSinceReferenceDate:(NSTimeInterval)ti NS_DESIGNATED_INITIALIZER;
- (nullable instancetype)initWithCoder:(NSCoder *)aDecoder NS_DESIGNATED_INITIALIZER;

@end
```
如果全能初始化方法与超类不同，需要覆写超类中的对应方法，如果超类的初始化方法不适用于子类，那么应该覆写这个超类方法，并且抛出异常。

```js
- (id)initWWithWidth:(CGFloat)width andHeight:(CGFloat)height
{
	@throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"some propmt" userInfo:nil];
}
```

## 实现”description”方法
我们经常会自己定义一些类来处理本地的model，但是通常都不写description，直到今天我才领略到它的好处，我们经常会进入调试阶段，如果一个自定的类没有实现description那么他po调试的或者用NSLog去打印结果是这样的

```js
(lldb) po Person
<Person: 0x17c39e30>

2015-12-23 16:13:42.477 PTKit[1707:5603] <Person: 0x17c39e30>
```
Person中的其他信息根本看不见。如果我们实现description(提供给log使用) 还有 debugDescription（提供调试使用）。

```js
- (NSString *) description {
	return [NSString stringWithFormat:@"%@ %@", _firstName, _lastName];
}

- (NSString *) debugDescription {
	return [NSString stringWithFormat:@"%@ %@", _firstName, _lastName];
}
```

在去调试和打赢结果就是完全不一样的

```js
(lldb) po Person
<Person: 0x17c39e30, "Bob Smith">

2015-12-23 16:13:42.477 PTKit[1707:5603] <Person: 0x17c39e30, "Bob Smith">

```
但是这个好像和我们在调试系统的看起来不太一样，一般系统类会将类中公开属性对应的值纷纷列出来。

```js

<UIView: 0x17c39e30; frame = (0 0; 320 568); autoresize = W+H; layer = <CALayer: 0x17cd4db0>>
```
这个将会重新开篇文章来说明

## 尽量使用不可变对象
在之前我们提到过NSMutableSet内部结构很容易被破坏，那么我们不应该把可变的collection作为属性公开，应该提供相关方法以此修改对象中可变collection。

## 使用清晰而协调的命名方法
```js
推荐
UIButton *settingsButton;
- (void)lessonController:(LessonController *)lessonController didSelectLesson:(Lesson *)lesson;
- (void)lessonControllerDidFinish:(LessonController *)lessonController;
- - (instancetype)initWithScheduledOperationsRepository:(id<BMAGenericUGCRepositoryProtocol>)repository
                     scheduledOperationsSearchService:(id<BMAGenericSearchServiceProtocol>)searchService;
不推荐
UIButton *setBut;
- (void)lessonControllerDidSelectLesson:(Lesson *)lesson;
- (instancetype)initWithScheduledOperations:(id<BMAGenericUGCRepositoryProtocol>)repository
                     scheduledOperationsSearch:(id<BMAGenericSearchServiceProtocol>)searchService;
```

## 为私有方法名添加前缀
不用单用下滑线，那是apple公司预留的
```js
-（void）p_privateMethod(
	/*...*/
)
```
## 理解Objective-C错误模型
应该将错误信息放在NSError对象中。

## 理解NSCopying协议
所有的NSObject类型都尊从NSCopying协议

```js
- (id)copyWithZone:(NSZone *)zone
```
如果要实现Person的拷贝

```js
@interface Person : NSObject
@property (nonatomic, copy, readonly) NSString *firstName;
@property (nonatomic, copy, readonly) NSString *lastName;
- (id)initWithFirstName:(NSString *)firstName andLastName:(NSString *)lastName;
@end

@implementation EOCPerson
{
	NSMutableSet *_friends;
}

- (id)initWithFirstName:(NSString *)firstName andLastName:(NSString *)lastName
{
	if ((self = [super init])) {
		_firstName = firstName;
		_lastName = lastName;
		_friends = [NSMutableSet new];
	}
	return self;
}

- (id)copyWithZone:(NSZone*)zone {
    Person *copy = [[[self class] allocWithZone:zone]
                    initWithFirstName:_firstName
                          andLastName:_lastName];
    copy->friends = [_friend mutableCopy];
    return copy;
}
@end
```

这边需要注意的friends的copy，使用了->语法，以为friends并不是copy的属性。但是这里对friends 中的对象没有进行深拷贝。需要将上面的方法改为

```js
- (id)copyWithZone:(NSZone)zone {
  Person copy = [[[self class] allocWithZone:zone]
  copy->friends = [NSMutableSet initWithSet:friends copyItems:YES];
  return copy;
}
```
