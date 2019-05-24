---
title: Effective Objective-C 2.0 笔记(二)

lang: zh-CN
image: https://picsum.photos/1920/1080/?random&date=2015-12-12
date: 2015-12-12
tags:
  - Standard
categories:
  - Objective-C
meta:
  - name: description
    content: 用Objective-C等面向对象语言编程时，“对象”就是“基本构造单元”，开发者可以通过对象来存储并传递数据。在对象之间传递数据并执行任务的过程就叫做“消息传递”。若想编写出高效且易维护的代码，就一定要熟悉这两个特性的工作原理。
---

用Objective-C等面向对象语言编程时，“对象”就是“基本构造单元”，开发者可以通过对象来存储并传递数据。在对象之间传递数据并执行任务的过程就叫做“消息传递”。若想编写出高效且易维护的代码，就一定要熟悉这两个特性的工作原理。

<!-- more -->

当应用程序运行起来以后，为其童工相关支持的代码叫做“Objective-C运行期环境”，它提供了一些使得对象之间能够传递消息的重要函数，并且包含创建类实例所用的全部逻辑。

## 理解“属性”这一概念
“属性”是Objective-C 的一项特性，用于封装对象中的数据，Objective-C 对象通常会把其所需要的数据保存为各种实例变量。实例变量一般通过“存取方法”来访问。
Objective-C 中定义一个类通常使用@property语法来实现，他帮助属性自动合成（autosynthesis）”获取方法”和”设置方法”，合成方法(synthesized method)是过程的代码由编译器在编译期执行，除了生成代码代码以外，编译器还自动向类中添加适当类型的实例变量，并且在属性名前面加下划线，

### synthesize关键字
能指定实例变量的名字：
```js
@implementation Person
@synthesize firstName = _myFirstName;
@synthesize lastName = _myLastName;
@end
```

他将帮助生成实例变量命名为_myFirstName和_myLastName 而不再使用默认的名字。
若不想令编译器自动合成存取方法，则可以自己实现，
如果你实现了其中的一个存取方法，那么另外一个还是会有编译器来实现合成的。

### @dynamic关键字
能阻止编译器自动合成存取方法

### 原子性
在默认情况下，由编译器所合成的方法会通过锁定机制保存其原子性(atomicity)。如果属性具备nonatomic特质，则不使用同步锁。请注意，尽管没有名为”atomic”的特质（如果某属性不具备nanatomic特质，那它就是”原子的”（atomic）。
在一般情况下，所有的属性都声明为nonatomic。这样做的历史原因：在iOS中使用同步锁的开销较大，这会带来性能问题，一般情况下并不要求属性必须是”原子的”，因为这并不能保证”线程安全”，若要实现”线程安全”的操作，还需要采用更为深层的锁定机制才行，

### assign
“设置方法”只会执行针对”纯量类型”比如：NSInteger、CGFloat等简单赋值操作。

### strong
此特质表明该属性定义了一种”拥有关系”。为这种属性设置新值，设置方法会先保留新值，并释放旧值，然后再将新值设置上去

### weak
此特质表明该属性定义了一种”非拥有关系”。为这种属性设置新值时，设置方法既不保存新值也不保存旧值。此特质和assign类似，然而在属性所指的对象遭到摧毁时，属性值也会清空

### unsafe_unretained
此特质的语义和assign相同，但它适用于”对象类型”，该特质表达一种”非拥有关系”，当目标对象遭到摧毁时，属性值也不会自动清空，这一点与weak有区别

### copy
此特质所表达的所属关系与strong类似。然而设置方法并不保存新值，而是将其”拷贝”（copy）。当属性类型为NSString *时，经常用此特质来保护其封装性，因为传递给设置方法的新值有可能指向一个NSMutableString 类的实例。这个类是NSString的一个子类，表示一种可以修改其值的字符串，此时若是不拷贝字符串，那么设置完属性之后，字符串值就可能会在对象不知情的情况下遭人更改。所以，这时就要拷贝一份”不可变”的字符串，确保对象中的字符串值不会无意向变动。只要实现属性所用的对象是”可变的”，就应该在设置新属性值时拷贝一份。

### getter=\
指定”获取方法”的方法名，如果属性是Boolean型，而你想为其获取方法加上”is”可以使用下面的方法：

```js
@property (nonatomic, getter=isOn) BOOL on;
```

### setter=\
不太常见

## 在对象内部尽量直接访问实例变量
在写入实例变量时，通过其设置方法来做，而在读取实例变量时，则直接访问

- 直接访问实例变量的速度比较快
- 不会调用其”设置方法”，这样可以绕过为了相关属性所定义的”内存管理语义”
- 直接访问实例变量不会触发”键值观测”通知
- 有助于排查与之相关的错误，

## 理解”对象等同性”
在比对两个对象的等同性”==”不一定是我们想要的结果，比如比较两个字符串是否相等，”==”只能判断两个对象对应在栈上指向变量的内存地址是否相等，而不是判断其值是否相等。
如果检测对象的等同性，需要提供”isEqual”和 hash方法。hash方法在其中扮演了重要的角色。我们在面试的时候经常会遇到一个问题，NSArray和NSSet的区别，大部分只能说出他们NSAarry是有序的NSSet是无序的。而忽略了他们的查询功能。

## NSArray和NSSet的区别
- NSArray存储是有序的NSSet是无序的
- NSSet的搜索效率比NSArray高，主要是他用到了一个算法hash。比如你存储元素A 一个hash算法直接就能找到A应该存储的位置（NSSet内部是通过hash封装了不同的数组，就像一个个字典一样），当你访问A时，一个hash过程就恩呢刚找到A存储的位置，而对于NSArry，若想要知道A到底在不在数组中，则需要遍历整个数组，效率显然很低。
- NSSet 千万不能存储可变类型对象，以为对象存储已将在指定的hash对应的数组中了，如果你改变可变实例的值的时候，再去查找，这时候hash已经变了，很容易造成找不到。

## 在既有类中使用关联对象存放自定义数据
当我们遇到无法给一个类添加一个实例，Objective-C中有一项强大的特性，可以解决此问题，就是”关联对象”（associated object），可以给某对象关联许多其他对象。
下列方法用于管理关联对象

```js
void objc_setAssociatedObject(id object, void *key, id value, objc_AssociationPolicy policy),此方法以给定的键和策略为某对象设置关联对象值
id objc_getAssociatedObject(id object, void *key) 根据给定的键从对象中获取相应的关联对象
void objc_removeAssociatedObjects(id object) 移除指定对象的全部关联对象
```
#对象关联类型表


| 关联类型                          | 等效的@property属性 |
| --------------------------------- | ------------------- |
| OBJC_ASSOCIATION_ASSIGN           | assign              |
| OBJC_ASSOCIATION_RETAIN_NONATOMIC | nonatomic, retain   |
| OBJC_ASSOCIATION_COPY_NONATOMIC   | nonatomic, copy     |
| OBJC_ASSOCIATION_RETAIN           | retain              |
| OBJC_ASSOCIATION_COPY             | copy                |

For example
```js
#import <objc/runtime.h>
static void *EOCMyAlertViewKey = "EOCMyAlertViewKey"

- (void)askUserQuestion {
	UIAlertView *alert =
        [[UIAlertView alloc] initWithTitle:@"Question"
                                   message:@"what do you want to do"
                                  delegate:self
                         cancelButtonTitle:@"cancel"
                         otherButtonTitles:@"continue", nil];

	void (^block)(NSInteger) = ^(NSInteger buttonIndex) {
			// do something
	};
	objc_setAssociatedObject(alert, EOCMyAlertViewKey, block, OBJC_ASSOCIATION_COPY);
	[alert show];
}

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex {
	void (^block)(NSInteger) = objc_getAssociatedObject(alertView, EOCMyAlertViewKey);
	block(buttonIndex);
}
```


## 理解objc_msgSend的作用
函数调用方式，在C语言中使用”静态绑定”也就是说，在编译期就能决定运行时所应调用的函数，在Objective-C，使用的是”动态绑定”，所用的函数知道运行期才能确定。

**C语言**
```js
#import <stdio.h>

void printHello()
{
	printf("Hello, world!\n");
}
void printGoodbye()
{
	printf("Goodbye, world!\n");
}
void doTheThing(int type)
{
	if(type == 0) {
		printHello();
	} else {
		printGoodbye();
	}
	return 0;
}
```

**Objective-C**
```js
#import <stdio.h>

void printHello()
{
	printf("Hello, world!\n");
}
void printGoodbye()
{
	printf("Goodbye, world!\n");
}
void doTheThing(int type)
{
	void (*func)();
	if(type == 0) {
		func = printHello;
	} else {
		func = printGoodbye;
	}
	func();
	return 0;
}
```

id returnValue = objc_msgSend(someObject, @selector(messageName:), parameter);
该方法需要在接受者所属的类中搜寻其”方法列表”如果能找到与选择子名称相符的方法，就跳至其实现代码。若找不到，那就沿着继承体继续向上查找，等找到合适的方法之后在跳转，如果最终都没有找到这时候就需要走消息转发了。
代用一个方法似乎需要好多步骤，所幸objc_msgSend会将匹配结果缓存在”快速映射表”里面，每个类都有这样一块缓存，若稍后还向该类发送与选择子相同的消息，那么执行起来就很快了

## 用”方法调用技术”调试”黑盒方法”
方法调用技术（method swizzling）我们开发的时候在系统类中的category经常会用到
JRSwizzle这个库是我们常用到的，具体原理就不就这样带过了。但是这种方法也不能滥用。

## 理解”类对象”的用意
在runtime源码中定义id,
```js
typedef struct objc_object *id;

struct objc_object {
private:
    isa_t isa;

public:

    // ISA() assumes this is NOT a tagged pointer object
    Class ISA();

    // getIsa() allows this to be a tagged pointer object
    Class getIsa();

};

union isa_t
{
    isa_t() { }
    isa_t(uintptr_t value) : bits(value) { }

    Class cls;
    uintptr_t bits;
}

objc_object::ISA()
{
    assert(!isTaggedPointer());
    return isa.cls;
}
```
每个对象结构体的首个成员是isa_t类的变量，该变量的结构体中Class定义了对象所属的类，通常称为”is a”指针((is a)NSString， isa 指针就指向NSString)。

```js
typedef struct objc_class *Class;
struct objc_class : objc_object {
    Class superclass;
    const char *name;
    uint32_t version;
    uint32_t info;
    uint32_t instance_size;
    struct old_ivar_list *ivars;
    struct old_method_list **methodLists;
    Cache cache;
    struct old_protocol_list *protocols;
    // CLS_EXT only
    const uint8_t *ivar_layout;
    struct old_class_ext *ext;
	Class getMeta() {
        if (isMetaClass()) return (Class)this;
        else return this->ISA();
    }
}
```
objc_class是继承objc_object的，所以子啊objc_class 第一个元素就是isa。在这个结构体中有个变量叫superclass，它定义了本类的超类。类对象所属的类型（也就是isa 中的class指针所指向的类型）是另外一个类，叫做”元类”(metaclass)，用来表述类对象本身所具备的元数据。每个类仅有一个”类对象”，而每个”类对象”仅有一个与之相关的”元类”。

## isMemberOfClass 和 isKindOfClass
```js
NSMutableDictionary *dict = [NSMutableDictionary new];
[dict isMemberOfClass:[NSDictionary class]]; //NO
[dict isMemberOfClass:[NSMutableDictionary class]]; //YES
[dic isKindOfClass:[NSDictionary class]]; //YES
[dic isKindOfClass:[NSArray class]]; //NO
```
