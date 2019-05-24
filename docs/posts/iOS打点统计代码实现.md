---
title: iOS 打点统计代码实现
lang: zh-CN
display: home
image: https://picsum.photos/1920/1080/?random&date=2016-01-07
date: 2016-01-07
tags:
  - Optimize
categories:
  - Objective-C
meta:
  - name: description
    content: 很早之前拜读了limboy 的iOS 统计打点那些事这篇文章，之后又了解了heapanalytics可视化全埋点，对我的帮助很大。
---

很早之前拜读了limboy 的iOS 统计打点那些事这篇文章，之后又了解了heapanalytics可视化全埋点，对我的帮助很大。

<!-- more -->

前期的简单做法是UI设计完界面后标坐标的时候同时给所有可点击控件标一个event id。 这个id可以为一个递增数字, 也可以为控件内随机点一个点后取x,y的组合, 也可以用随机数的, 只要保证唯一就可以了。 event id可以一类控件用一个id, 也可以按照界面将一类控件分成多个id。 一类控件用多个id的好处是数据组好过滤。然后开发写代码的时候将这个id写进控件里面, 然后全局拦截所有的点击事件, 加入埋点处理的代码。

为了与其他端保持一致的统计方式最后实现的格式如下

```html
UIView page = "XMStoreScrollPageViewController" pageAttribute =
     {"shopId" : "54131c6b0364b0ed8f1ffd90"}><PTCollectionView><
    XMHomePageRootShelfModuleItemCell eventId = "40001" indexPath = "{4, 0}" rect =
        "{0, 325.5, 276, 183}"></ XMHomePageRootShelfModuleItemCell></ PTCollectionView></ UIView>
```

我们只统计到当前ViewController的层，当然如果view没有对应的viewController 那么就使用window当根节点。

## Code

整合limboy提供能的代码，可以完成如下

```js
#import <Foundation/Foundation.h>

@interface PTAnalytics : NSObject

+(instancetype)sharedInstance;
- (void)setupAnalytics;

@end
```

```js
#import "Aspects.h"
#import "UIView+Extents.h"
#import "PTAnalyticsUtility.h"

@interface PTAnalytics () {
    NSDictionary *_analyticsRules;
}

@end

@implementation PTAnalytics

#pragma mark - super method

+ (void)load
{
    PTWeakSelf;
    __block id observer = [[NSNotificationCenter defaultCenter]
        addObserverForName:UIApplicationDidFinishLaunchingNotification
                    object:nil
                     queue:nil
                usingBlock:^(NSNotification *_Nonnull note) {
                  PTStrongSelf;
                  [self setup];
                  [[NSNotificationCenter defaultCenter] removeObserver:observer];
                }];
}

+ (void)setup
{
    [[PTAnalytics sharedInstance] setupAnalytics];
}

#pragma mark - Life cycle

+(instancetype)sharedInstance
{
	static dispatch_once_t once;
	static id __singleton__ = nil;
	dispatch_once(&once, ^{ __singleton__ = [[self alloc] init]; });
	return __singleton__;
}

- (instancetype)init
{
    if ((self = [super init])) {
        _analyticsRules = [[NSDictionary alloc] init];
        //可以从自己的plist文件中读取对应的数据
        _analyticsRules = @{
            @"XMStoreScrollPageViewController" : @[ @"collectionView:didSelectItemAtIndexPath:" ]
        };
    }
    return self;
}

/**
 *  遍历所有需要hook类
 */
- (void)setupAnalytics
{
    PTWeakSelf;
    [_analyticsRules enumerateKeysAndObjectsUsingBlock:^(NSString *className, NSArray *selectors,
                                                         BOOL *_Nonnull stop) {
      PTStrongSelf;
      [self setupAnalyticsClass:className selectors:selectors];
    }];
}

/**
 *  遍历类中需要hook的方法
 *
 *  @param className 类名
 *  @param selectors 方法名
 */
- (void)setupAnalyticsClass:(NSString *)className selectors:(NSArray *)selectors
{
    Class kClass = NSClassFromString(className);
    PTWeakSelf;
    [selectors
        enumerateObjectsUsingBlock:^(NSString *selector, NSUInteger idx, BOOL *_Nonnull stop) {
          PTStrongSelf;
          SEL sel = NSSelectorFromString(selector);
          [self eventWithClass:kClass selector:sel];
        }];
}

/**
 *  the same to eventWithClass: selector: eventHandler:
 *
 *  @param kClass 类
 *  @param selector 方法
 */
- (void)eventWithClass:(Class)kClass selector:(SEL)selector
{
    [self eventWithClass:kClass selector:selector eventHandler:nil];
}

/**
 *  给类方法进行hook position为AspectPositionAfter
 *
 *  @param kClass       类
 *  @param selector     方法
 *  @param eventHandler 回调函数
 */
- (void)eventWithClass:(Class)kClass
              selector:(SEL)selector
          eventHandler:(void (^)(id<AspectInfo> ascpectInfo))eventHandler
{
    PTWeakSelf;
    [kClass aspect_hookSelector:selector
                    withOptions:AspectPositionAfter
                     usingBlock:^(id<AspectInfo> aspectInfo) {
                       PTStrongSelf;
                       [self analyticAspectInfo:aspectInfo.arguments];
                     } error:NULL];
}

/**
 *  分析hook之后方法对应的参数列表
 *
 *  @param arguments 方法参数列表
 */
- (void)analyticAspectInfo:(NSArray *)arguments
{
    id arg = [arguments firstObject];
    if (([arg isKindOfClass:[UITableView class]] || [arg isKindOfClass:[UICollectionView class]]) &&
        [arguments count] > 1) {
        [self analyticScrollViewAspectInfo:arguments];
    } else if ([arg isKindOfClass:[UIView class]]) {
        [self printHierarchyDetailDescriptionForView:arg arguments:arguments];
    } else {
    }
}

/**
 *  分析UITableView 和 UICollectionView 的点击函数中的参数匹配
 *
 *  @param arguments 参数
 */
- (void)analyticScrollViewAspectInfo:(NSArray *)arguments
{
    if (![[arguments lastObject] isKindOfClass:[NSIndexPath class]]) {
        [self printHierarchyDetailDescriptionForView:[arguments firstObject] arguments:arguments];
        return;
    }
    NSIndexPath *indexPath = (NSIndexPath *)[arguments lastObject];
    UIView *aView = [arguments firstObject];
    if ([aView isKindOfClass:[UITableView class]]) {
        UITableView *view = (UITableView *)aView;
        UITableViewCell *cell = [view cellForRowAtIndexPath:indexPath];
        [self printHierarchyDetailDescriptionForView:cell arguments:arguments];
    } else if ([aView isKindOfClass:[UICollectionView class]]) {
        UICollectionView *view = (UICollectionView *)aView;
        UICollectionViewCell *cell = [view cellForItemAtIndexPath:indexPath];
        [self printHierarchyDetailDescriptionForView:cell arguments:arguments];
    } else {
    }
}

/**
 *  打印当前view 对应在window上面父类树节点的view信息
 *
 *  @param view 当前view
 */
- (void)printHierarchyDetailDescriptionForView:(UIView *)view arguments:(NSArray *)arguments
{
    UIView *aView = view;
    NSMutableArray *mutableStringArray = [@[] mutableCopy];
    [mutableStringArray addObject:[PTAnalyticsUtility prefixDetailDescriptionForView:aView
                                                                           arguments:arguments
                                                                            showRect:YES]];
    [mutableStringArray addObject:[PTAnalyticsUtility subfixDetailDescriptionForView:aView]];
    if (![aView ex_viewController]) {
        while ([aView superview]) {
            aView = [aView superview];
            [mutableStringArray
                insertObject:[PTAnalyticsUtility prefixDetailDescriptionForView:aView]
                     atIndex:0];
            [mutableStringArray
                addObject:[PTAnalyticsUtility subfixDetailDescriptionForView:aView]];
            if ([aView ex_viewController]) {
                break;
            }
        }
        }
	NSMutableString *mutableString = [@"" mutableCopy];
	for (NSString *str in mutableStringArray) {
		[mutableString appendString:str];
	}
	NSLog(@"%@",mutableString);
}

@end
```

```js
@implementation PTAnalyticsUtility

+ (NSString *)prefixDetailDescriptionForView:(UIView *)view;
{
    return [[self class] prefixDetailDescriptionForView:view arguments:nil showRect:NO];
}

+ (NSString *)prefixDetailDescriptionForView:(UIView *)view
                                   arguments:(NSArray *)arguments
                                    showRect:(BOOL)show
{
    NSMutableString *mutableString = [@"" mutableCopy];
    [mutableString appendFormat:@"<%@", [view class]];
    UIViewController *viewController = [view ex_viewController];
    if (viewController) {
        [mutableString
            appendFormat:@" page = \"%@\"", NSStringFromClass([[view ex_viewController] class])];
        NSString *pageAttribute =
            [[self class] descriptionForViewControllerAttribute:viewController];
        if (pageAttribute) {
            [mutableString appendFormat:@" pageAttribute = %@ ", pageAttribute];
        }
    }

    if ([arguments count] > 1) {
        NSString *argumentString = [[self class] descriptionForArguments:arguments];
        if (argumentString) {
            [mutableString appendString:argumentString];
        }
    }

    if (show) {
        [mutableString appendFormat:@" rect = \"%@\"", [[self class] stringForCGRect:view.frame]];
        NSString *viewAttributeString = [[self class] descriptionForViewAttribute:view];
        if (viewAttributeString) {
            [mutableString appendFormat:@" viewAttribute = %@ ", viewAttributeString];
        }
    }

    [mutableString appendFormat:@">"];
    return [NSString stringWithString:mutableString];
}

+ (NSString *)subfixDetailDescriptionForView:(UIView *)view
{
    return [NSString stringWithFormat:@"</%@>", [view class]];
}

+ (NSString *)stringForCGRect:(CGRect)rect
{
    return [NSString stringWithFormat:@"{%g, %g, %g, %g}", rect.origin.x, rect.origin.y,
                                      rect.size.width, rect.size.height];
}

+ (NSString *)stringForIndexPath:(NSIndexPath *)indexPath
{
    return [NSString stringWithFormat:@"{%zd, %zd}", indexPath.section, indexPath.row];
}

+ (NSString *)descriptionForArguments:(NSArray *)arguments
{
    NSMutableString *mutableString = [@"" mutableCopy];
    if ([arguments count] > 1) {
        for (NSInteger i = 1; i < [arguments count]; i++) {
            id __object__ = [arguments objectAtIndex:i];
            if ([__object__ isKindOfClass:[NSIndexPath class]]) {
                [mutableString
                    appendFormat:@" indexPath = \"%@\"",
                                 [[self class] stringForIndexPath:(NSIndexPath *)__object__]];
            } else if ([__object__ isKindOfClass:[NSObject class]]) {
                [mutableString
                    appendFormat:@" %@ = %@ ", NSStringFromClass([__object__ class]), __object__];
            } else {
            }
        }
    }

    if ([mutableString isEqualToString:@""]) {
        return nil;
    }
    return [NSString stringWithString:mutableString];
}

+ (NSString *)descriptionForViewControllerAttribute:(UIViewController *)viewController
{
    NSMutableDictionary *dict = [@{} mutableCopy];
    [dict setValue:[viewController ex_valueForSelector:@"shopId"] forKey:@"shopId"];

    RpcShop *shop = [viewController ex_valueForSelector:@"shop"];
    [dict setValue:[shop getShopId] forKey:@"shopId"];

    RpcProductCategory *category = [viewController ex_valueForSelector:@"category"];
    [dict setValue:[category getCid] forKey:@"cid"];

    if ([[dict allValues] count] < 1) {
        return nil;
    }
    return [dict JSONString];
}

+ (NSString *)descriptionForViewAttribute:(UIView *)view
{
    NSMutableDictionary *dict = [@{} mutableCopy];
    [dict setValue:[view ex_valueForSelector:@"pid"] forKey:@"pid"];
    [dict setValue:[view ex_valueForSelector:@"eventId"] forKey:@"eventId"];
    if ([[dict allValues] count] < 1) {
        return nil;
    }
    return [dict JSONString];
}

@end
```

```js
@implementation NSObject (Extents)

- (id)ex_valueForSelector:(NSString *)selectorString
{
	id value = nil;

	if ([self respondsToSelector:NSSelectorFromString(selectorString)]) {
	value = [self valueByPerformingSelector:NSSelectorFromString(selectorString)];
	}
	return value;
}

@end

@implementation UIView (Extents)
- (UIViewController *)ex_viewController
{
    UIViewController *viewController = nil;
    SEL viewDelSel = NSSelectorFromString([NSString stringWithFormat:@"%@ewDelegate", @"_vi"]);
    if ([self respondsToSelector:viewDelSel]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
        viewController = [self performSelector:viewDelSel];
#pragma clang diagnostic pop
    }
    return viewController;
}

@end
```

## 整合
很多死板的方式是在 print 函数中将打印的字符串上报到服务器，这样的坏处是你每点击一次就会上报一次，对服务器的压力有点大。那么最好的方式是将这些打点记录到一个文件中，等下次应用唤起的时候上传文件到日志分析平台。其实这种方式现有三方控件有很多。我使用的是CocoaLumberjack，它是Mac和iOS上一个集快捷、简单、强大和灵活于一身的日志框架。

**用DDLog替换NSLog语句**

DDLog的头文件定义了你用来替换NSLog语句的宏，本质上看起来向下边这样：

```js
// Convert from this:
NSLog(@"Broken sprocket detected!");
NSLog(@"User selected file:%@ withSize:%u", filePath, fileSize);

// To this:
DDLogError(@"Broken sprocket detected!");
DDLogVerbose(@"User selected file:%@ withSize:%u", filePath, fileSize);
```


我们看到DDLog宏和NSLog的语法完全相同。

所以你所要做的就是决定每个NSlog语句属于哪种日志级别。DDLog默认有四种级别的日志，分别是：

- @DDlogError
- @DDlogWarn
- @DDlogInfo
- @DDlogVerbose

其实这种标记方式跟我们打点统计好像没有什么关系，后来我们将DDLog重新封装了下，添加一个级别 Statistic 的等级。以便之后日志分析系统方便查看和分析。

![](http://muscliy.github.io/images/2016-1-8-PTAnalytics-1.png)


## 优化
这种打点方式的一个缺陷是在你给一个按键添加一个点击事件的时候就需要将对应的方法加入到你的文件列表中。在iOS中有这么一个函数,所有UI事件都会经过这个函数,补充: 实际测试发现对 UICollectionView, UITableView等 控件要做额外的 Hook。

```js
［UIApplication sendAction:to:from:forEvent:］
```
可以将PTAnalytics.m做如下修改

```js
- (void)setupAnalytics
{
    PTWeakSelf;
    [_analyticsRules enumerateKeysAndObjectsUsingBlock:^(NSString *className, NSArray *selectors,
                                                         BOOL *_Nonnull stop) {
      PTStrongSelf;
      [self setupAnalyticsClass:className selectors:selectors];
	}];

	[UIApplication aspect_hookSelector:@selector(sendAction:to:from:forEvent:) withOptions:AspectPositionAfter usingBlock:^(id<AspectInfo> aspectInfo) {
		id obj = [aspectInfo.arguments objectAtIndex:2];
					 if ([obj isKindOfClass:[UIView class]]) {
						 [self printHierarchyDetailDescriptionForView:obj arguments:nil];
					 } else {
						 PTLogInfo(@"the sender is not a view");
					 }
	} error:nil];

}
```

当然你还可以hook UITableView 和 UICollectionView 的delegate的方法

```js
[UICollectionView
    aspect_hookSelector:@selector(setDelegate:)
            withOptions:AspectPositionAfter
             usingBlock:^(id<AspectInfo> aspectInfo) {

               if (!([aspectInfo.arguments firstObject] == [NSNull null])) {
                   id object = [aspectInfo.arguments firstObject];
                   [object
                       aspect_hookSelector:@selector(collectionView:didSelectItemAtIndexPath:)
                               withOptions:AspectPositionAfter
                                usingBlock:^(id<AspectInfo> aAspectInfo) {
                                  if (![aAspectInfo.arguments firstObject] == [NSNull null]) {
                                      [self analyticAspectInfo:aAspectInfo.arguments];
                                  }
                                } error:nil];
               }

             } error:nil];
```
