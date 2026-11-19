import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChecklistItemRow } from '@/components/inspection/ChecklistItemRow';
import { AnswerToggle } from '@/components/inspection/AnswerToggle';
import type { ChecklistItem } from '@/types';

const gaugeQuestion: ChecklistItem = {
  itemId: 'fe-gauge',
  description: 'Pressure gauge needle is in the green zone',
  category: 'Working condition',
  severity: 'critical',
  result: 'not_checked',
};

function setup(answer?: { result: 'pass' | 'fail' | 'flag'; notes: string }, item: ChecklistItem = gaugeQuestion) {
  const onResult = jest.fn();
  const onNotes = jest.fn();
  render(
    <ul>
      <ChecklistItemRow item={item} answer={answer} onResult={onResult} onNotes={onNotes} />
    </ul>
  );
  return { onResult, onNotes, user: userEvent.setup() };
}

describe('ChecklistItemRow', () => {
  it('shows the question, three answer buttons and a "Critical" tag for critical items', () => {
    setup();
    expect(screen.getByText(gaugeQuestion.description)).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((button) => button.textContent)).toEqual(['Pass', 'Fail', 'Flag']);
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('does not show the Critical tag for a low-severity question', () => {
    setup(undefined, { ...gaugeQuestion, severity: 'low' });
    expect(screen.queryByText('Critical')).not.toBeInTheDocument();
  });

  it('reports the answer when a button is tapped', async () => {
    const { onResult, user } = setup();
    await user.click(screen.getByRole('radio', { name: 'Fail' }));
    expect(onResult).toHaveBeenCalledWith('fail');
  });

  it('asks for no note when the answer is Pass', () => {
    setup({ result: 'pass', notes: '' });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it.each([
    ['fail', 'Fail'],
    ['flag', 'Flag'],
  ] as const)('opens a note box when the answer is %s, and says the note is needed', (result, word) => {
    setup({ result, notes: '' });
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText(`(needed for ${word})`)).toBeInTheDocument();
  });

  it('marks the note box as invalid while it is empty, and clears that when text is there', () => {
    const { rerender } = render(
      <ul>
        <ChecklistItemRow item={gaugeQuestion} answer={{ result: 'fail', notes: '' }} onResult={jest.fn()} onNotes={jest.fn()} />
      </ul>
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    rerender(
      <ul>
        <ChecklistItemRow item={gaugeQuestion} answer={{ result: 'fail', notes: 'Needle in the red' }} onResult={jest.fn()} onNotes={jest.fn()} />
      </ul>
    );
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
  });

  it('passes what is typed to onNotes', async () => {
    const { onNotes, user } = setup({ result: 'fail', notes: '' });
    await user.type(screen.getByRole('textbox'), 'x');
    expect(onNotes).toHaveBeenCalledWith('x');
  });

  it('limits notes to 500 characters, matching the server', () => {
    setup({ result: 'flag', notes: '' });
    expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '500');
  });
});

describe('AnswerToggle', () => {
  it('marks only the chosen answer as checked', () => {
    render(<AnswerToggle label="Gauge" value="flag" onChange={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Flag' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Pass' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'Fail' })).toHaveAttribute('aria-checked', 'false');
  });

  it('is a labelled group, so a screen reader announces which question the buttons belong to', () => {
    render(<AnswerToggle label="Pressure gauge" value={undefined} onChange={jest.fn()} />);
    expect(screen.getByRole('radiogroup', { name: 'Pressure gauge' })).toBeInTheDocument();
  });

  it('is a single tab stop: only the chosen answer is reachable with Tab', () => {
    render(<AnswerToggle label="Gauge" value="fail" onChange={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Fail' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: 'Pass' })).toHaveAttribute('tabindex', '-1');
  });

  it('moves the answer with the arrow keys and wraps around at the ends', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<AnswerToggle label="Gauge" value="pass" onChange={onChange} />);
    screen.getByRole('radio', { name: 'Pass' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('fail');
    expect(screen.getByRole('radio', { name: 'Fail' })).toHaveFocus(); // focus follows the choice

    screen.getByRole('radio', { name: 'Pass' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('flag'); // from Pass, left wraps round to the last one
  });

  it('makes every button at least 48px tall for gloved thumbs (h-12)', () => {
    render(<AnswerToggle label="Gauge" value={undefined} onChange={jest.fn()} />);
    for (const button of screen.getAllByRole('radio')) expect(button).toHaveClass('h-12');
  });
});
