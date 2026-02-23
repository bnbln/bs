---
id: 8
title: Integrating Lottie Animations
subtitle: Bringing smooth animations to iOS, Android, and Web
slug: integrating-lottie
category: [Development, Motion Design]
published: '2026-02-23'
image: assets/sample-lottie.json
heroLottie: assets/sample-lottie.json
bgColor: '#2E8B57'
hasAnimation: false
featured: true
type: [Development]
---

# Lottie Animations Across Platforms

Lottie is an open-source animation file format that’s built specifically to render vector graphics efficiently. Integrating it across web, iOS, and Android platforms creates a seamless, high-quality, and scalable animation experience. 

## The Web Integration

On the web, we use `lottie-react` to effortlessly render the animations. By adding a simple custom component and injecting it into the render pipeline, we can display complex animations perfectly synced with our layout.

Here is an inline example of a Lottie animation embedded directly in this markdown file:

```lottie
path="assets/sample-lottie.json"
loop="true"
```

## Native: iOS and Android

For iOS and Android native apps, `lottie-ios` and `lottie-android` provide first-class support. You just add the dependency, drop the `.json` file in your bundle, and instantiate the `LottieAnimationView`.

```swift
import Lottie

let animationView = LottieAnimationView(name: "sample-lottie")
animationView.frame = view.bounds
animationView.contentMode = .scaleAspectFit
animationView.loopMode = .loop
view.addSubview(animationView)
animationView.play()
```

## Conclusion

With this integration, this custom React architecture now natively supports Lottie in both the Hero header and inline within the body content, using the exact same declarative markdown approach as imagery and code blocks.
