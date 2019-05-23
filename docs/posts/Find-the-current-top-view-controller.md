---
title: Find the current top view controller
lang: zh-CN
display: home
image: https://picsum.photos/1920/1080/?random&date=2015-12-10
date: 2015-12-10
tags:
  - Optimize
  - Objective-C
categories:
  - iOS
meta:
  - name: description
  - content: 关于在iOS中怎样正确的找到当前的viewcontroller
---

关于在iOS中怎样正确的找到当前的viewcontroller

<!-- more -->

Objective-C version

```js
- (UIViewController *)topViewController{
  return [self topViewController:[UIApplication sharedApplication].keyWindow.rootViewController];
}

- (UIViewController *)topViewController:(UIViewController *)rootViewController
{
  if (rootViewController.presentedViewController == nil) {
    UINavigationController *navigationController =
    (UINavigationController *)rootViewController;
    return [[navigationController viewControllers] lastObject];
  }

  if ([rootViewController.presentedViewController isMemberOfClass:[UINavigationController class]]) {
    UINavigationController *navigationController = (UINavigationController *)rootViewController.presentedViewController;
    UIViewController *lastViewController = [[navigationController viewControllers] lastObject];
    return [self topViewController:lastViewController];
  }

  UIViewController *presentedViewController = (UIViewController *)rootViewController.presentedViewController;
  return [self topViewController:presentedViewController];
}
```

Swift version

```js
func visibleViewController() -> UIViewController?
{
	if let rootViewController: UIViewController = 	self.rootViewController {
		return UIWindow.getVisibleViewControllerFrom(rootViewController)
	}
return nil
}

class func getVisibleViewControllerFrom(vc:UIViewController) -> UIViewController
{
	if vc.isKindOfClass(UINavigationController.self) {
    	let navigationController = vc as UINavigationController
    	return UIWindow.getVisibleViewControllerFrom( navigationController.visibleViewController)

	} else if vc.isKindOfClass(UITabBarController.self) {

    	let tabBarController = vc as UITabBarController
    	return UIWindow.getVisibleViewControllerFrom(tabBarController.selectedViewController!)

	} else {

    	if let presentedViewController = vc.presentedViewController {

        	return UIWindow.getVisibleViewControllerFrom(presentedViewController.presentedViewController!)

    	} else {
        	return vc;
    }
}
```
