/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// A simple component for testing
const SimpleComponent: React.FC<{ message: string }> = ({ message }) => {
  return <div data-testid="simple-component">{message}</div>;
};

describe('SimpleComponent', () => {
  test('renders with a message', () => {
    render(<SimpleComponent message="Hello, World!" />);
    
    const element = screen.getByTestId('simple-component');
    expect(element).toBeInTheDocument();
    expect(element.textContent).toBe('Hello, World!');
  });
}); 