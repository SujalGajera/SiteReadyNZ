import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { EquipmentEmptyState } from '@/components/equipment/EquipmentEmptyState';
import { DeleteEquipmentDialog } from '@/components/equipment/DeleteEquipmentDialog';
import { EquipmentToolbar } from '@/components/equipment/EquipmentToolbar';
import { EquipmentRow } from '@/components/equipment/EquipmentRow';
import type { Equipment } from '@/types';

const extinguisher: Equipment = {
  _id: 'eq-1', name: 'Extinguisher, reception', type: 'fire_extinguisher', location: 'Reception', serialNumber: 'FE-100',
  expiryDate: '2027-01-15T00:00:00.000Z', purchaseDate: '2026-01-15T00:00:00.000Z', status: 'due_soon',
};

describe('EquipmentEmptyState', () => {
  it('invites the manager to add the first item when there is none', async () => {
    const onAdd = jest.fn();
    render(<EquipmentEmptyState isFiltered={false} onClearFilters={jest.fn()} onAdd={onAdd} />);
    expect(screen.getByText('No equipment on the map yet')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add equipment' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('offers to clear the filters when they hide everything', async () => {
    const onClear = jest.fn();
    render(<EquipmentEmptyState isFiltered onClearFilters={onClear} onAdd={jest.fn()} />);
    expect(screen.getByText('Nothing matches those filters')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe('DeleteEquipmentDialog (deleting always asks first)', () => {
  it('is hidden until an item is chosen', () => {
    render(<DeleteEquipmentDialog item={null} isDeleting={false} onConfirm={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('names the item and warns that it cannot be undone', () => {
    render(<DeleteEquipmentDialog item={extinguisher} isDeleting={false} onConfirm={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete Extinguisher, reception?');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('for good');
  });

  it('confirms only when the red button is pressed, and "Keep it" cancels', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(<DeleteEquipmentDialog item={extinguisher} isDeleting={false} onConfirm={onConfirm} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Keep it' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Delete equipment' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('makes the confirm button red (destructive)', () => {
    render(<DeleteEquipmentDialog item={extinguisher} isDeleting={false} onConfirm={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Delete equipment' })).toHaveClass('bg-destructive');
  });

  it('blocks both buttons while the delete is in progress, so it cannot be sent twice', () => {
    render(<DeleteEquipmentDialog item={extinguisher} isDeleting onConfirm={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByRole('button', { name: /Delete equipment/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Keep it' })).toBeDisabled();
  });
});

describe('EquipmentToolbar', () => {
  const props = { search: '', onSearchChange: jest.fn(), statusFilter: 'all' as const, onStatusFilterChange: jest.fn(), sortOption: 'urgency' as const, onSortOptionChange: jest.fn() };

  it('has a labelled search box, a status filter and a sort control (every list has all three)', () => {
    render(<EquipmentToolbar {...props} />);
    expect(screen.getByRole('searchbox', { name: 'Search equipment' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filter by status' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toBeInTheDocument();
  });

  it('reports what is typed in the search box', async () => {
    render(<EquipmentToolbar {...props} />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search equipment' }), 'k');
    expect(props.onSearchChange).toHaveBeenCalledWith('k');
  });

  it('shows the current choices in plain words', () => {
    render(<EquipmentToolbar {...props} statusFilter="overdue" sortOption="name" />);
    expect(screen.getByRole('combobox', { name: 'Filter by status' })).toHaveTextContent('Check overdue');
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveTextContent('Name, A to Z');
  });
});

describe('EquipmentRow', () => {
  const renderRow = () =>
    render(
      <MemoryRouter>
        <ul>
          <EquipmentRow item={extinguisher} onEdit={jest.fn()} onDelete={jest.fn()} />
        </ul>
      </MemoryRouter>
    );

  it('shows the name as a link to the detail page, with place and serial number', () => {
    renderRow();
    expect(screen.getByRole('link', { name: 'Extinguisher, reception' })).toHaveAttribute('href', '/equipment/eq-1');
    expect(screen.getByText(/Reception · FE-100/)).toBeInTheDocument();
  });

  it('shows the expiry date in New Zealand style and the status', () => {
    renderRow();
    expect(screen.getByText('15 Jan 2027')).toBeInTheDocument();
    expect(screen.getByText('Due soon')).toBeInTheDocument();
  });

  it('shows a short code for the kind of equipment (FE), hidden from screen readers', () => {
    renderRow();
    expect(screen.getByText('FE')).toHaveAttribute('aria-hidden', 'true');
  });

  it('colours the left edge by status', () => {
    const { container } = renderRow();
    expect(container.querySelector('li > span')).toHaveClass('bg-kowhai');
  });

  it('has an actions button labelled with the item name, at least 44px square', () => {
    renderRow();
    const actions = screen.getByRole('button', { name: 'Actions for Extinguisher, reception' });
    expect(actions).toHaveClass('h-11', 'w-11');
  });
});
