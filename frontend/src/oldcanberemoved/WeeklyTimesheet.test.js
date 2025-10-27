
// frontend/src/components/WeeklyTimesheet.test.js
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import WeeklyTimesheet from './WeeklyTimesheet';
import { renderWithProviders, mockProject, mockTask } from '../utils/testUtils';

// Mock API services
jest.mock('../services/ProjectDataService', () => ({
  getAll: jest.fn()
}));

jest.mock('../services/TaskDataService', () => ({
  getAll: jest.fn()
}));

import ProjectDataService from '../services/ProjectDataService';
import TaskDataService from '../services/TaskDataService';

describe('WeeklyTimesheet Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    ProjectDataService.getAll.mockResolvedValue({
      data: [mockProject]
    });
    
    TaskDataService.getAll.mockResolvedValue({
      data: [mockTask]
    });
  });

  test('renders timesheet with project dropdown', async () => {
    renderWithProviders(<WeeklyTimesheet />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Weekly Timesheet')).toBeInTheDocument();
    });
    
    // Check if project dropdown is present
    expect(screen.getByLabelText(/project/i)).toBeInTheDocument();
  });

  test('loads projects and tasks on mount', async () => {
    renderWithProviders(<WeeklyTimesheet />);
    
    await waitFor(() => {
      expect(ProjectDataService.getAll).toHaveBeenCalledTimes(1);
      expect(TaskDataService.getAll).toHaveBeenCalledTimes(1);
    });
  });

  test('enables task dropdown when project is selected', async () => {
    renderWithProviders(<WeeklyTimesheet />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/project/i)).toBeInTheDocument();
    });
    
    // Select a project
    const projectDropdown = screen.getByLabelText(/project/i);
    fireEvent.change(projectDropdown, { target: { value: mockProject.id } });
    
    // Check if task dropdown becomes enabled
    await waitFor(() => {
      const taskDropdown = screen.getByLabelText(/task/i);
      expect(taskDropdown).not.toBeDisabled();
    });
  });

  test('updates hours when input changes', async () => {
    renderWithProviders(<WeeklyTimesheet />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByLabelText(/project/i)).toBeInTheDocument();
    });
    
    // Find and update hours input
    const hoursInput = screen.getByLabelText(/monday/i);
    fireEvent.change(hoursInput, { target: { value: '8' } });
    
    expect(hoursInput.value).toBe('8');
  });

  test('displays error message when API fails', async () => {
    // Mock API failure
    ProjectDataService.getAll.mockRejectedValue(new Error('API Error'));
    
    renderWithProviders(<WeeklyTimesheet />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
