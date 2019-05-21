---
title: Effective Objective-C 2.0 笔记(四)
lang: zh-CN
image: https://picsum.photos/1920/1080/?random&date=2016-01-20
date: 2016-01-20
tags:
  - Standard
  - Objective-C
categories:
  - iOS
meta:
  - name: description
    content: Objective-C语言有一项特性叫做“协议（protocol）”,他和java里面的“接口相似”。Objective-C不支持多重继承，因而我们把某个类应该实现的一系列方法定义在协议里面。协议最常见的用途是实现委托模式，不过也有其他用法。理解并善用协议可以令代码变得更易维护，因为协议这种方式很好地描述接口。
---

Objective-C语言有一项特性叫做“协议（protocol）”,他和java里面的“接口相似”。Objective-C不支持多重继承，因而我们把某个类应该实现的一系列方法定义在协议里面。协议最常见的用途是实现委托模式，不过也有其他用法。理解并善用协议可以令代码变得更易维护，因为协议这种方式很好地描述接口。
<!-- more -->
“分类（category）”也是Objective-C的一项重要特性，利用分类机制，我们无须继承子类即可直接为当前类添加方法，而其他的编程语言中则需要通过继承子类来实现。

## 通过委托与数据源协议进行对象间通信
委托（delegate）与 数据源（data source）， 在iOS控件中最为代表性的控件就是UITableView，它定义了一套接口， 某个对象想要接受UITableView 的委托就需要遵从这些接口，这样的话UITableview就可以给委托对象回传一些消息，比如cell的点击相应。


```js
@property (nonatomic, weak, nullable) id <UITableViewDataSource> dataSource;
@property (nonatomic, weak, nullable) id <UITableViewDelegate> delegate;
```
检查某个委托的对象是否相应特定的选择子，通常是这样实现

```js
if ([delegate respondsToSelector:@selector(someClassDidSomething)]) {
    [delegate someClassDidSomething];
 }
```

但是如果我们频繁执行此操作的话，那么除了第一次检测的结果有用之外，后续的检测可能都是多余的。鉴于此，我们通常把委托对象能否响应某个协议方法这一信息缓存起来，以优化程序效率。apple官方通常使用结构来缓存。

```js
struct {
        int tableViewHeightForRowAtIndexPath : 1;
        int tableViewHeightForHeaderInSection : 1;
        int tableViewHeightForFooterInSection : 1;

        int tableViewViewForHeaderInSection : 1;
        int tableViewViewForFooterInSection : 1;

        int tableViewWillDisplayCellForRowAtIndexPath : 1;
        int tableViewDidEndDisplayingCellForRowAtIndexPath : 1;
        int tableViewDidEndDisplayingHeaderViewForSection : 1;
        int tableViewDidEndDisplayingFooterViewForSection : 1;

        int tableViewWillSelectRowAtIndexPath : 1;
        int tableViewDidSelectRowAtIndexPath : 1;

        int tableViewWillDeselectRowAtIndexPath : 1;
        int tableViewDidDeselectRowAtIndexPath : 1;

        int tableViewEditingStyleForRowAtIndexPath : 1;
    } _delegateRespondsTo;
```

实现缓存功能的代码可以在写delegate属性对应的函数中实现


```js
- (void)setDelegate:(id<UITableViewDelegate>)delegate {
  [super setDelegate:delegate];

  _delegateRespondsTo.tableViewHeightForRowAtIndexPath = [delegate
      respondsToSelector:@selector(tableView:heightForRowAtIndexPath:)];
  _delegateRespondsTo.tableViewHeightForHeaderInSection = [delegate
      respondsToSelector:@selector(tableView:heightForHeaderInSection:)];
  _delegateRespondsTo.tableViewHeightForFooterInSection = [delegate
      respondsToSelector:@selector(tableView:heightForFooterInSection:)];

  _delegateRespondsTo.tableViewViewForHeaderInSection = [delegate
      respondsToSelector:@selector(tableView:viewForHeaderInSection:)];
  _delegateRespondsTo.tableViewViewForFooterInSection = [delegate
      respondsToSelector:@selector(tableView:viewForFooterInSection:)];

  _delegateRespondsTo.tableViewWillDisplayCellForRowAtIndexPath =
      [delegate respondsToSelector:@selector(tableView:
                                         willDisplayCell:
                                       forRowAtIndexPath:)];
  _delegateRespondsTo.tableViewDidEndDisplayingCellForRowAtIndexPath =
      [delegate respondsToSelector:@selector(tableView:
                                       didEndDisplayingCell:
                                          forRowAtIndexPath:)];

  _delegateRespondsTo.tableViewWillSelectRowAtIndexPath = [delegate
      respondsToSelector:@selector(tableView:willSelectRowAtIndexPath:)];
  _delegateRespondsTo.tableViewDidSelectRowAtIndexPath = [delegate
      respondsToSelector:@selector(tableView:didSelectRowAtIndexPath:)];
  _delegateRespondsTo.tableViewDidEndDisplayingHeaderViewForSection =
      [delegate respondsToSelector:@selector(tableView:
                                       didEndDisplayingHeaderView:
                                                       forSection:)];
  _delegateRespondsTo.tableViewDidEndDisplayingFooterViewForSection =
      [delegate respondsToSelector:@selector(tableView:
                                       didEndDisplayingFooterView:
                                                       forSection:)];

  _delegateRespondsTo.tableViewWillDeselectRowAtIndexPath = [delegate
      respondsToSelector:@selector(tableView:willDeselectRowAtIndexPath:)];
  _delegateRespondsTo.tableViewDidDeselectRowAtIndexPath = [delegate
      respondsToSelector:@selector(tableView:didDeselectRowAtIndexPath:)];

  _delegateRespondsTo.tableViewEditingStyleForRowAtIndexPath = [delegate
      respondsToSelector:@selector(tableView:editingStyleForRowAtIndexPath:)];

  [self _setNeedsReload];
}
```

## 将类的实现代码分散到便于管理的数个分类之中
经常我们会遇到一个类，会出来很多的函数。所有的代码都可能写在一个大文件中，如果还向类中添加方法的话，那么源代码文件会越来越大，代码的可读性也对来越差，拿UIView举个例子。
```js
@interface UIView(UIViewGeometry)
//和位置坐标相关的操作函数
@end

@interface UIView(UIViewHierarchy)
//和试图结构层次相关的函数
@end

@interface UIView(UIViewAnimation)
//和动画相关的函数
@end
```

即使类本身不是太大，我们也可以使用分类机制将其切割成几块，把相应代码归入不同的“功能区”中。

## 总是为第三方类的分类名称前加前缀
如果是你自己需要给一个类添加类别，那么在他的方法名称前加前缀。例如你要给NSString 添加一个HTTP的类别方法避免使用下面方式

```
@interface NSString(HTTP)

- (NSString *) urlEncodeString

@end
```

一个是因为容易和第三方库中的其他NSString类别中的urlEncodeString方法造成冲突。还有个是objective-c版本升级之后再他是实现方法中可能会有这个方法，下面的方式才是推荐的

```js
@interface NSString(ABC_HTTP)

- (NSString *) abc_urlEncodeString

@end
```

## 勿在分类中声明属性
在平时开发中我自己也经常在分类中添加方法，比如在给一个UIView定义一个eventId,可以用作打点统计，如果不在类别中添加，那么需要将UIView在封装一层，添加一个属性了，而且你每次需要创建打点事件的view时你都需要先继承你封装过后的View，更麻烦的是当你遇到cell的时候你不得不在封一次。这样的做法可能很愚蠢，虽然标题中说不要在分类中声明属性，我想应该是尽量避免，毕竟在类别中定义一个属性是被允许的，那么好东西都是要用在刀刃上的，而且现在是ARC的时代了，不用手动去管理内存，文章中说道“给类别添加一个属性，在内存管理问题上容易出错，因为在实现存取的时候经常会忘记遵从其内存管理语义”。

## 使用“class-continuation分类”隐藏实现细节
“class-continuation分类”，一个没有名字的类别

```js
@interface ECOPerson()
@end
```

用法一：可以在“class-continuation分类”中定义一些实例变量、私有的方法，只有类的内部能看到这些属性的，做到保密性。代码的可读性也比较高。

用法二：将public接口中声明为只读的属性，扩展为“可读写”，这样在实现文件中就可以任意修改属性的值了，但是该属性需要做同步机制，因为当观察者正在读取属性值而内部代码又在写入该属性时，可能引发“竞争条件”。

```js
@interface ECOPerson:NSObject

@property (nonatomic, readonly) NSString *firstName;

@end

@interface ECOPerson()

@property (nonatomic, readwrite) NSString *firstName;

@end
```

用法三：协议私有性，有时我们并不希望在公共的接口中泄露了类遵从了摸个协议，比方说ECOPerson遵从了ECOSecretDelegate协议，如果声明在公共接口里就像下面的

```js
@interface ECOPerson:NSObject<ECOSecretDelegate>

@property (nonatomic, readonly) NSString *firstName;

@end
```

这样写的话你还需要import “ECOSecretDelegate.h”到你头文件中，有人说可以使用@protocol ECOSecretDelegate来避免写import， 但是只要引入ECOPerson头文件的地方，编译器都会给出下面的警告


> warning: cannot find protocol definition for "ECOSecretDelegate"

如果将delegate声明在class-continuation中就可以避免这些问题了

```js
@interface ECOPerson()<ECOSecretDelegate>

@property (nonatomic, readwrite) NSString *firstName;

@end
```
## 理解引用计数
随着Objective-C的更新和优化，现在使用非ARC已经很少了，但是这块东西始终不能忘记，因为它对学号Objective-C来说十分重要。很多细节如果说清楚可能需要写一本好长好长的博客，我们只需要理顺书本中所说的内容就可以了如果想深入理解引用计数的原理请看玉令天下的博客。

![](http://muscliy.github.io/images/2016-1-21-effective-4-1.png)

如上图中，ObjectB 与 ObjectC都引用了ObjectA。若ObjectB与ObjectC都不在使用ObjectA， 则其保留计数降为0， 于是便可摧毁了，还有其他对象想令ObjectB与ObjectC继续存活，而应用程序里又有另外一些对象想令那些对象继续存活。如果按“引用树”回溯，那么最终会发现一个“根对象”在Mac OS X应用程序中，此对象就是NSApplication对象，而在iOS应用程序中，则是UIApplication对象。两者都是应用程序启动创建的单例。

## ARC下在dealloc方法中只释放引用并解除监听
---

ARC会自动生成.cxx_destruct方法，在dealloc中会自动释放对象，但是有几种情况需要我们手动去释放，

- CoreFoundation对象，因为他是纯C的API所生成的，
- 清理通知的对象订阅
- 清理KVO中的观察行为
- 对象持有文件描述符资源也需要在dealloc中释放([scokect close])

```js
- (void)dealloc
{
	CFRelease(coreFoundationObject)l
	[[NSNotificationCenter defaultCenter] removeObserver:self];
}
```

## 编写“异常安全代码”时留意内存管理问题
---
Objective-C 和 C++ 一样提供异常处理机制，如果先在try块中保留某个对象， 然后在释放前又抛出异常，那么除非catch能处理此问题，否则对象所占用的内存将泄漏。

```js
@try {
ECOSomeClass *obj = [[ECOSomeClass alloc] init];
[obj doSomethingThatMayThrow];
[obj release];
}
@catch(…) {

}
```

> 代码看上去没有什么问题，但是如果当obj在调用doSomethingThatMayThrow抛出异常，[obj release]将不会被调用，那么对象就泄漏了，最好的解决办法是讲release代码放在@finally中调用

```js
ECOSomeClass *obj
@try {
obj = [[ECOSomeClass alloc] init];
[obj doSomethingThatMayThrow];
}
@catch(…) {

} @finally {
[obj release];
}
```

> 上面说的是非ARC的环境下，大家在ARC环境下默认以为在try处理异常程序中ARC会自动处理。但实际上ARC不会自动处理
```js
@try {
ECOSomeClass *obj = [[ECOSomeClass alloc] init];
[obj doSomethingThatMayThrow];
}
@catch(…) {

}
```
如果代码中出现try处理异常，就需要将“-fobjc-arc-exceptions”这个编译器标志打开，Objective-C ++ 中是默认打开的，因为Objective-C++ 程序员会频繁使用C++中的异常处理代码。

## 以弱引用避免保留环
用unsafe_unretained 修饰的属性特质，其语义同assign特质等价。然而，assign通常只用于“整体类型”（int， float， 结构体等）， unsafe_unretained则多用于对象类型。weak属性特质和unsafe_unretained的作用完全相同， 只要系统把属性回收，属性值就会自动设为nil。
