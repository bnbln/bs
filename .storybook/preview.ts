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
            ['--font-space-grotesk' as string]: '"Space Grotesk", sans-serif',
            ['--font-inter' as string]: '"Inter", sans-serif',
          },
        },
        React.createElement(Story)
      ),
  ],
  parameters: {
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
