---
id: 14
title: "Developing a Next.js-Portfolio for a Product Designer"
subtitle: "A Frontend Developement Project opening Perspectives with three.js"
slug: "btnhlz"
category: "Frontend-Developement"
published: "2024-05-21"
image: "assets/frame32.png"
bgColor: "#00ECEB"
hasAnimation: false
featured: true
---
# Developing a Next.js-Portfolio for a Product Designer
How can a portfolio become more than a static showcase? That was the question driving this project for a product designer. Instead of relying on flat galleries or PDF presentations, I built an interactive web experience that brings his objects and furniture designs into a spatial, almost tangible environment.

![assets/frame33.png|assets/frame34.png]

The site was developed with **Next.js** as the framework and **three.js** for rendering 3D visuals directly in the browser. This combination allowed us to merge robust performance and SEO with immersive, GPU-accelerated graphics. Every piece of furniture can be rotated, zoomed, and experienced in context, turning the website into a lightweight digital exhibition.

The design language is kept clean and minimal: white backgrounds, cyan highlights, and large-scale imagery let the organic forms of the furniture stand in the foreground. A modular grid organizes news, objects, exhibitions, and partners — giving the designer full flexibility to expand the portfolio over time.

```palette
Blue #009EDC rgb(0,158,220) usage=Brand Color
Cyan #00ECEB rgb(0,236,235) usage=Highlight Color
Gallery-White #F2F2F2 rgb(242,242,242) usage=Background
```


From a technical perspective, the challenge was to create a smooth 3D experience without heavy loading times. We used optimized GLTF models, lazy loading, and fine-tuned lighting settings to ensure that every scene runs fluidly on both desktop and mobile devices. The Next.js architecture provided the foundation for fast builds and scalable hosting.

```tsx title="Three.js Canvas"
<Canvas
  shadows
  linear
  dpr={[1, 2]}
  camera={{ position: [camPos.x, camPos.y, camPos.z], fov: 65 }}
  onCreated={({ gl, scene }) => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = PCFSoftShadowMap;
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.2;
    gl.physicallyCorrectLights = true;
    scene.background = null;
  }}
>
  <Preload all />
  <Scene items={items} targetIndex={index} />
</Canvas>
```
The result is more than just a portfolio website — it’s a **digital stage for design**. By blending frontend development with immersive 3D presentation, the project opens new perspectives on how product designers can present their work online: as interactive, living objects instead of static images.