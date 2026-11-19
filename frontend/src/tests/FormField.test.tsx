import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormField } from '@/components/forms/FormField';

describe('FormField', () => {
  it('has a visible label that is connected to the input (never placeholder-only)', () => {
    render(<FormField label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument(); // finds the input through its label
  });

  it('shows an error message, marks the input invalid, and links the two for screen readers', () => {
    render(<FormField label="Email" error="Enter a valid email address" />);
    const input = screen.getByLabelText('Email');
    const message = screen.getByText('Enter a valid email address');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toBe(message.id);
  });

  it('shows the hint when there is no error, and the error instead of the hint when there is one', () => {
    const { rerender } = render(<FormField label="Password" hint="At least 8 characters." />);
    expect(screen.getByText('At least 8 characters.')).toBeInTheDocument();
    rerender(<FormField label="Password" hint="At least 8 characters." error="Use at least 8 characters" />);
    expect(screen.queryByText('At least 8 characters.')).not.toBeInTheDocument();
    expect(screen.getByText('Use at least 8 characters')).toBeInTheDocument();
  });

  it('is not marked invalid when there is no error', () => {
    render(<FormField label="Name" />);
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-invalid');
  });

  it('lets the person show and hide a password', async () => {
    const user = userEvent.setup();
    render(<FormField label="Password" type="password" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('only offers the show/hide button on password fields', () => {
    render(<FormField label="Email" type="email" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('passes typing through to the page that owns the value', async () => {
    const onChange = jest.fn();
    render(<FormField label="Name" value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Name'), 'A');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
