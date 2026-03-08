import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from '@storybook/nextjs-vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import * as projectAnnotations from './preview';

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);

const originalWarn = console.warn.bind(console);
vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
  if (typeof args[0] === 'string') {
    const message = args[0];
    if (
      message.includes('Please ensure that the container has a non-static position') ||
      message.includes('<ambientLight /> is using incorrect casing') ||
      message.includes('<directionalLight /> is using incorrect casing') ||
      message.includes('does not recognize the `castShadow` prop')
    ) {
      return;
    }
  }
  originalWarn(...args);
});

const originalError = console.error.bind(console);
vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  if (typeof args[0] === 'string') {
    const message = args[0];
    if (
      message.includes('<ambientLight /> is using incorrect casing') ||
      message.includes('<directionalLight /> is using incorrect casing') ||
      message.includes('does not recognize the `castShadow` prop')
    ) {
      return;
    }
  }
  originalError(...args);
});

// Avoid flaky WebGL context failures for R3F stories in headless browser tests.
vi.mock('@react-three/fiber', async () => {
  const actual = await vi.importActual<typeof import('@react-three/fiber')>('@react-three/fiber');
  return {
    ...actual,
    Canvas: (props: any) => {
      try {
        // Execute child component trees in tests so Storybook coverage includes
        // component logic that normally lives inside <Canvas>.
        renderToStaticMarkup(React.createElement(React.Fragment, null, props?.children));
      } catch {
        // Ignore renderer-only incompatibilities in the mock environment.
      }

      return React.createElement('div', {
        className: props?.className,
        style: props?.style,
        'data-r3f-canvas': 'mocked',
      });
    },
    useFrame: () => undefined,
  };
});

vi.mock('@react-three/drei', async () => {
  const actual = await vi.importActual<typeof import('@react-three/drei')>('@react-three/drei');
  return {
    ...actual,
    OrbitControls: () => null,
    Environment: () => null,
    Float: () => null,
    Preload: () => null,
    useGLTF: () => ({
      scene: {
        clone: () => ({
          traverse: () => undefined,
        }),
      },
    }),
  };
});
