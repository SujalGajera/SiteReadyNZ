import { act, renderHook } from '@testing-library/react';
import { useFormFields } from '@/hooks/useFormFields';

type Values = { name: string; email: string };
const rules = (values: Values) => ({
  name: values.name.trim() ? undefined : 'Enter your name',
  email: values.email.includes('@') ? undefined : 'Enter an email',
});
const setup = () => renderHook(() => useFormFields<Values>({ name: '', email: '' }, rules));

describe('useFormFields (the form helper behind every form in the app)', () => {
  it('shows no errors on a fresh form, even though the fields are empty', () => {
    const { result } = setup();
    expect(result.current.errors).toEqual({});
  });

  it('shows a field\'s error only after the person has left that field', () => {
    const { result } = setup();
    act(() => result.current.markTouched('name'));
    expect(result.current.errors).toEqual({ name: 'Enter your name' }); // email is still untouched, so no email error
  });

  it('updates the message live once a field has been touched, and clears it when fixed', () => {
    const { result } = setup();
    act(() => result.current.markTouched('name'));
    act(() => result.current.setValue('name', 'Aroha'));
    expect(result.current.errors.name).toBeUndefined();
    act(() => result.current.setValue('name', '   '));
    expect(result.current.errors.name).toBe('Enter your name');
  });

  it('keeps the typed values', () => {
    const { result } = setup();
    act(() => result.current.setValue('email', 'a@example.com'));
    expect(result.current.values).toEqual({ name: '', email: 'a@example.com' });
  });

  it('validateAll reveals every problem at once and says the form is not valid', () => {
    const { result } = setup();
    let valid = true;
    act(() => {
      valid = result.current.validateAll();
    });
    expect(valid).toBe(false);
    expect(result.current.errors).toEqual({ name: 'Enter your name', email: 'Enter an email' });
  });

  it('validateAll says the form is valid when nothing is wrong', () => {
    const { result } = setup();
    act(() => {
      result.current.setValue('name', 'Aroha');
      result.current.setValue('email', 'a@example.com');
    });
    let valid = false;
    act(() => {
      valid = result.current.validateAll();
    });
    expect(valid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('reset puts the values back and hides all errors, as when a slide-over is reopened', () => {
    const { result } = setup();
    act(() => result.current.validateAll());
    expect(Object.keys(result.current.errors)).toHaveLength(2);
    act(() => result.current.reset({ name: 'Prefilled', email: 'p@example.com' }));
    expect(result.current.values).toEqual({ name: 'Prefilled', email: 'p@example.com' });
    expect(result.current.errors).toEqual({});
  });
});
