---
title: 探究NSUserDefaults
lang: zh-CN
display: home
image: https://picsum.photos/1920/1080/?random&date=2015-07-03
date: 2015-07-03
tags:
  - NSFoundation
categories:
  - Objective-C
meta:
  - name: description
    content: 研究NSUserDefaults之前我们首先需要研究的是.plist文件，.plist文件首先是一种用来存储序列化后的对象的文件，对象包括objective-c中的6种基本类型（NSString、NSArray …)。当你在写程序的时候将一些关键数据使用NSUserDefaults保存之后我们会在.plist文件中一一找到它们。
---

研究NSUserDefaults之前我们首先需要研究的是.plist文件，.plist文件首先是一种用来存储序列化后的对象的文件，对象包括objective-c中的6种基本类型（NSString、NSArray …)。当你在写程序的时候将一些关键数据使用NSUserDefaults保存之后我们会在.plist文件中一一找到它们。

<!-- more -->

## NSUserDefaults工作原理
**Apple 官方文档（一）**

```
At runtime, you use an NSUserDefaults object to read the defaults that your
application uses from a user’s defaults database. NSUserDefaults caches
the information to avoid having to open the user’s defaults database
each time you need a default value. The synchronize method, which is
automatically invoked at periodic intervals, keeps the in-memory cache
in sync with a user’s defaults database.
```

根据文档(一)可以看出来，NSUserDefault是.plist文件的缓存，NSUserDefault会将访问到的key 缓存到内存中，下次访问时，如果缓存中有对应的key就直接访问，如果没有在从文件中载入？应用还会时不时调用
```
[defaults synchronize]
```
方法来保证内存与文件中数据的一致性。上面文档说
中的最后一句表明了UserDefaults是根据时间戳定时的把缓存中的数据写入本地磁盘，而非即时写入。为了防止数据丢失，我们在对重要的数据保存时使用synchornize方法强制写入。但是也要注意，不用频繁的使用synchornize，这样毕竟影响性能和效率
```
NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
```
NSUserDefaults是单例，同时也是线程安全的

## 性能

从性能上分析，这种缓存的机制带来了一定的性能提升，通过一些网上的文章了解到在10万个Key的情况下，通过NSUserDefaults来读取value是1ms级别的，然而当你从plist文件中直接读取，需要100ms的级别开销，但是写是个相反的结果，要是你写1个10万条数据到plist文件中是1s级别的开销，而同时写入10万条NSUserDefaults键值对则需要10s级别的延迟。我们都知道在创建key/value时，程序需要在内存中也创建一个相应的映射关系，然后系统会时不时调用“synchronsize”方法同步数据，很多的方法会导致创建key/value pair被阻塞。

总的来说，使用NSUserDefaults是比较高效的,但是不能大量的将数据通过NSUserDefaults中

##存储
NSUserDefaults中并不是所有写入都是可以写入到文件中的。

**Apple 官方文档（二）**

```
The contents of the registration domain are not written to disk; you need
to call this method each time your application starts. You can place a plist
file in the application's Resources directory and call registerDefaults:
with the contents that you read in from that file.
```
```
[[NSUserDefaults standardUserDefaults] registerDefaults:defaultValues];
```

文档(二)中所说的registerDefaults方法添的内容不会保存到plist文件中，只在当前生命周期内使用，下面看一个程序

```
NSDictionary *dicDefault = [NSDictionary dictionaryWithObjectsAndKeys: @"hslinux", @"Name",nil];

[[NSUserDefaults standardUserDefaults] registerDefaults:dicDefault];

NSString *strName = [[NSUserDefaults standardUserDefaults] stringForKey:@"Name"];
NSLog(@" Name = [%@]", strName);

[[NSUserDefaults standardUserDefaults] setObject:@"?????" forKey:@"Name"];
strName = [[NSUserDefaults standardUserDefaults] stringForKey:@"Name"];
NSLog(@" Name = [%@]", strName);

[[NSUserDefaults standardUserDefaults] removeObjectForKey:@"Name"];
NSString *strDefault = [[NSUserDefaults standardUserDefaults] stringForKey:@"Name"];
NSLog(@"Default Name = [%@]", strDefault);
```

打印结果是

```
2015-07-02 14:18:46.716 TestDemo[2217:167621]  Name = [hslinux]
2015-07-02 14:18:46.719 TestDemo[2217:167621]  Name = [?????]
2015-07-02 14:18:46.720 TestDemo[2217:167621] Default Name = [hslinux]
```

由此可以看出来setObject 和 registerDefaults 是存在NSUserdefaults中两个不同区域，我们把两个区域分别叫持久缓存区和全局临时存储区，读的时候通过key会先查找持久缓存区读取value，如果没有，然后再从全局缓存区查找。两个缓存区有各自用处，比如我们需要一些数据在app运行时需要全局持有化是需要用到registerDefaults
