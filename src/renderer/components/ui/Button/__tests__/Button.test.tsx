import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Search, Copy, Trash2 } from 'lucide-react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn', 'btn-secondary', 'btn-md');
  });

  it('renders with primary variant', () => {
    render(<Button variant="primary">Primary</Button>);

    expect(screen.getByRole('button')).toHaveClass('btn-primary');
  });

  it('renders with danger variant', () => {
    render(<Button variant="danger">Delete</Button>);

    expect(screen.getByRole('button')).toHaveClass('btn-danger');
  });

  it('renders with icon variant', () => {
    render(<Button variant="icon">Icon Button</Button>);

    expect(screen.getByRole('button')).toHaveClass('btn-icon');
  });

  it('renders with ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);

    expect(screen.getByRole('button')).toHaveClass('btn-ghost');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-sm');

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-md');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-lg');
  });

  it('renders with an icon', () => {
    render(<Button icon={<Search size={14} data-testid="search-icon" />}>Search</Button>);

    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('renders icon-only button', () => {
    render(<Button icon={<Copy size={14} data-testid="copy-icon" />} iconOnly aria-label="Copy" />);

    const button = screen.getByRole('button', { name: /copy/i });
    expect(button).toHaveClass('btn-icon-only');
    expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Loading</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-loading');
    expect(button).toBeDisabled();
    expect(button.querySelector('.btn-spinner')).toBeInTheDocument();
  });

  it('hides icon when loading', () => {
    render(
      <Button icon={<Search size={14} data-testid="search-icon" />} loading>
        Search
      </Button>
    );

    expect(screen.queryByTestId('search-icon')).not.toBeInTheDocument();
    expect(screen.getByRole('button').querySelector('.btn-spinner')).toBeInTheDocument();
  });

  it('applies active class when active', () => {
    render(<Button active>Active</Button>);

    expect(screen.getByRole('button')).toHaveClass('btn-active');
  });

  it('applies full-width class', () => {
    render(<Button fullWidth>Full Width</Button>);

    expect(screen.getByRole('button')).toHaveClass('btn-full-width');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger click when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not trigger click when loading', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} loading>
        Loading
      </Button>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('passes through additional button attributes', () => {
    render(
      <Button type="submit" title="Submit form" aria-label="Submit">
        Submit
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('title', 'Submit form');
  });

  it('merges custom className with default classes', () => {
    render(<Button className="custom-class">Custom</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn', 'btn-secondary', 'custom-class');
  });

  it('can be used with danger modifier class for icon variant', () => {
    render(
      <Button variant="icon" icon={<Trash2 size={16} />} className="danger">
        Delete
      </Button>
    );

    expect(screen.getByRole('button')).toHaveClass('btn-icon', 'danger');
  });
});
