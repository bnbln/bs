import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from '@storybook/nextjs-vite';
import React from 'react';
import { vi } from 'vitest';
import * as projectAnnotations from './preview';

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);

// Avoid flaky WebGL context failures for R3F stories in headless browser tests.
vi.mock('@react-three/fiber', async () => {
  const actual = await vi.importActual<typeof import('@react-three/fiber')>('@react-three/fiber');
  return {
    ...actual,
    Canvas: (props: any) => React.createElement('div', { ...props, 'data-r3f-canvas': 'mocked' }),
    useFrame: () => undefined,
  };
});

vi.mock('@react-three/drei', async () => {
  const actual = await vi.importActual<typeof import('@react-three/drei')>('@react-three/drei');
  const passthrough = ({ children }: any) => React.createElement(React.Fragment, null, children);
  return {
    ...actual,
    OrbitControls: () => null,
    Environment: () => null,
    Float: passthrough,
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
