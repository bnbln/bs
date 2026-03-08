import React from 'react'
import type { Preview } from '@storybook/nextjs-vite'
import '../src/index.css'

const preview: Preview = {
  decorators: [
    (Story) =>
      React.createElement(
        'div',
        {
          style: {
            position: 'relative',
            ['--font-space-grotesk' as string]: '"Space Grotesk", sans-serif',
            ['--font-inter' as string]: '"Inter", sans-serif',
          },
        },
        React.createElement(Story)
      ),
  ],
  parameters: {
    backgrounds: {
      default: 'portfolio-light',
      values: [
        { name: 'portfolio-light', value: '#F5F5F7' },
        { name: 'portfolio-dark', value: '#1C1D20' },
        { name: 'portfolio-white', value: '#FFFFFF' },
      ],
    },
    nextjs: {
      image: {
        unoptimized: true,
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
}

export default preview
