---
title: 优雅的description
lang: zh-CN
image: https://picsum.photos/1920/1080/?random&date=2015-12-23
date: 2015-12-23
tags:
  - NSFoundation
categories:
  - Objective-C
meta:
  - name: description
    content: 在开发过程中，我们经常要打印并查看对象信息，一种是通过NSLog来输出一个对象的属性。
---

在开发过程中，我们经常要打印并查看对象信息，一种是通过NSLog来输出一个对象的属性。

<!-- more -->

```js
NSLog(@"Person = %@",person);
```
在构建打印字符串的时候，person对象会收到description消息，这个方法返回的信息就会取代格式字符串中的”%@”。另一种就是我们通过断点在控制台钟输入命令打印对象的属性
```js
lldb) po person
<Person: 0x17c39e30>
```

在输入po person的时候，person对象会收到debugDescription消息，这两个消息有什么区别吗，我们可以根据apple提供的NSObject的源代码中找到相应的代码

```js
// Replaced by CF (returns an NSString)
+ (NSString *)description {
    return nil;
}

// Replaced by CF (returns an NSString)
- (NSString *)description {
    return nil;
}

+ (NSString *)debugDescription {
    return [self description];
}

- (NSString *)debugDescription {
    return [self description];
}
```

其实调用的一个方法，只是方面我们在继承的类中自己实现来区别这两种打印方式所要呈现的内容。

在我们程序中引入的第三方库中我们可以找到一些description的方法。下面是来自AFNetworking中一类的description方法。

```js
- (NSString *)description {
    return [NSString stringWithFormat:@"<%@: %p, baseURL: %@, session: %@, operationQueue: %@>", NSStringFromClass([self class]), self, [self.baseURL absoluteString], self.session, self.operationQueue];
}
```
你会发现，这种写法一但你有很多的类也是一件麻烦事，你需要学很多关于这种格式化的代码。我们希望输出信息需要被格式化这样看的才清晰。
```js
(lldb) po p
<Person : 0x7fb7114d21d0, {
    firstName = "\U4e09";
    lastName = "\U5f20";
} >
```
使用NSDictionary来实现此功能,像这样：

```js
[NSString stringWithFormat:@"<%@ : %p, %@ >", NSStringFromClass([self class]), self,
                               @{ @"firstName" : _firstName,
                                  @"lastName" : _lastName }];
```

这种方法其实和AFNetworking一样，维护起来麻烦，那天需要添加一个属性，还需要去修改description方法。这种时候就需要依靠runtime 了， 我们需要获取所有对象中的属性和属性值，获取所有属性的方法, 可以添加一个NSObject类别来实现

```js
+ (NSArray<NSString *> *)ex_propertyKeys
{
	unsigned int outCount, i;
	NSMutableArray *keys = [@[] mutableCopy];
	objc_property_t *properties = class_copyPropertyList([self class], &outCount);
	for (i=0; i<outCount; i++) {
		objc_property_t property = properties[i];
		NSString * key = [[NSString alloc]initWithCString:property_getName(property)  encoding:NSUTF8StringEncoding];
		[keys addObject:key];
	}
	return [NSArray arrayWithArray:keys];
}
```

拿到对应的key通过kvc来获取对象的值就方便了,代码可以变成下面的实现方法，

```js
- (NSString *)ex_description
{
    NSArray *keys = [[self class] ex_propertyKeys];
    NSMutableDictionary *dict = [@{} mutableCopy];
    for (NSString *key in keys) {
        [dict setValue:[self valueForKey:key] forKey:key];
    }
    return
        [NSString stringWithFormat:@"<%@ : %p, %@ >", NSStringFromClass([self class]), self, dict];
}
```

最终一行搞定

```js
- (NSString *)description
{
    return [self ex_description];
}
```
