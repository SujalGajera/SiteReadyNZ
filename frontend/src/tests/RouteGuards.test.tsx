import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/routing/RouteGuards';
import { AuthContext, type AuthContextValue } from '@/context/AuthContext';
import type { User } from '@/types';

const manager: User = { id: 'm1', name: 'Aroha', email: 'a@example.com', role: 'manager' };
const staff: User = { id: 's1', name: 'Tane', email: 't@example.com', role: 'staff' };

function auth(user: User | null, isLoading = false): AuthContextValue {
  return { user, isLoading, login: jest.fn(), register: jest.fn(), logout: jest.fn() };
}

/** Shows where the guard sent us, and what it remembered about where we were going */
function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname + ' from=' + ((location.state as { from?: string } | null)?.from ?? 'none')}</p>;
}

function renderRoutes(user: User | null, startAt: string, isLoading = false) {
  render(
    <AuthContext.Provider value={auth(user, isLoading)}>
      <MemoryRouter initialEntries={[startAt]}>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<h1>Login page</h1>} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/inspections" element={<h1>Inspections page</h1>} />
          </Route>
          <Route element={<ProtectedRoute roles={['manager']} />}>
            <Route path="/equipment" element={<h1>Equipment page</h1>} />
          </Route>
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ProtectedRoute', () => {
  it('lets a signed-in person see a page that has no role restriction', () => {
    renderRoutes(staff, '/inspections');
    expect(screen.getByRole('heading', { name: 'Inspections page' })).toBeInTheDocument();
  });

  it('lets a manager into a manager-only page', () => {
    renderRoutes(manager, '/equipment');
    expect(screen.getByRole('heading', { name: 'Equipment page' })).toBeInTheDocument();
  });

  it('sends a signed-out visitor to the login page', () => {
    renderRoutes(null, '/equipment');
    expect(screen.getByRole('heading', { name: 'Login page' })).toBeInTheDocument();
  });

  it('keeps staff out of a manager-only page', () => {
    renderRoutes(staff, '/equipment');
    expect(screen.queryByRole('heading', { name: 'Equipment page' })).not.toBeInTheDocument();
    // Sent to "/", which the app's real route table turns into their own inspections page
    expect(screen.getByTestId('where')).toHaveTextContent('/ from=none');
  });

  it('shows a loading screen, not the login page, while it is still checking who is signed in', () => {
    renderRoutes(null, '/equipment', true);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Login page' })).not.toBeInTheDocument();
  });
});

describe('PublicOnlyRoute', () => {
  it('shows the login page to a signed-out visitor', () => {
    renderRoutes(null, '/login');
    expect(screen.getByRole('heading', { name: 'Login page' })).toBeInTheDocument();
  });

  it('turns a signed-in person away from the login page', () => {
    renderRoutes(manager, '/login');
    expect(screen.queryByRole('heading', { name: 'Login page' })).not.toBeInTheDocument();
  });
});
