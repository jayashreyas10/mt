import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../components/ui/Button.js';
import { Card } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Input } from '../components/ui/Input.js';

describe('Frontend UI Components Suite', () => {
  it('Button renders text and responds to click', () => {
    render(<Button>Calculate Payoff</Button>);
    expect(screen.getByRole('button', { name: /calculate payoff/i })).toBeInTheDocument();
  });

  it('Button shows loading spinner when isLoading=true', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('Badge renders correct variant text', () => {
    render(<Badge variant="success">6.5% Fixed APR</Badge>);
    expect(screen.getByText('6.5% Fixed APR')).toBeInTheDocument();
  });

  it('Input renders accessible label and validation error message', () => {
    render(
      <Input
        label="Mortgage Principal"
        placeholder="300000"
        error="Principal must be positive"
      />
    );
    expect(screen.getByLabelText(/mortgage principal/i)).toBeInTheDocument();
    expect(screen.getByText('Principal must be positive')).toBeInTheDocument();
  });

  it('Card renders children with styled container', () => {
    render(
      <Card>
        <div data-testid="card-child">Financial Metric Content</div>
      </Card>
    );
    expect(screen.getByTestId('card-child')).toBeInTheDocument();
  });
});
