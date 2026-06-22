//created by chatgpt


import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import RequestsList from './RequestsList';
import { AuthProvider } from '../../context/AuthContext';

// Mock the AuthContext
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { userId: 'test-user-id' },
    }),
}));

// Mock fetch
globalThis.fetch = vi.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({
            requests: [
                {
                    id: 'req-1',
                    item: 'Test Item',
                    pickupLocation: 'Loc A',
                    dropoffLocation: 'Loc B',
                    status: 'open',
                    userId: 'test-user-id', // User is the owner
                    pickupLat: 0,
                    pickupLng: 0,
                },
            ],
        }),
    })
);

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('RequestsList', () => {
    it('navigates to details page when Chat/Details button is clicked', async () => {
        render(
            <BrowserRouter>
                <RequestsList />
            </BrowserRouter>
        );

        // Wait for requests to load (simplified for this example)
        const button = await screen.findByText('Chat / Details');
        fireEvent.click(button);

        expect(mockNavigate).toHaveBeenCalledWith('/requests/req-1');
    });
});
