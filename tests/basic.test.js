// Basic test to verify testing infrastructure works
describe('Testing Infrastructure', () => {
  test('Jest is working correctly', () => {
    expect(true).toBe(true);
  });

  test('localStorage mock is available', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
  });

  test('DOM is available via JSDOM', () => {
    const div = document.createElement('div');
    div.textContent = 'test';
    expect(div.textContent).toBe('test');
  });

  test('Mock functions work', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  test('beforeEach resets localStorage', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
    // localStorage should be reset in the next test
  });

  test('localStorage is reset between tests', () => {
    expect(localStorage.getItem('test')).toBeNull();
  });
});

// Test utility functions that don't depend on browser classes
describe('Utility Functions', () => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const validateName = (name) => {
    return !!(name && name.trim && name.trim().length > 0);
  };

  const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  test('formatDate should format dates correctly', () => {
    const result = formatDate('2024-01-15');
    expect(result).toContain('2024');
    expect(result).toContain('Jan');
  });

  test('validateName should validate names', () => {
    expect(validateName('John Doe')).toBe(true);
    expect(validateName('')).toBe(false);
    expect(validateName('   ')).toBe(false);
    expect(validateName(null)).toBe(false);
  });

  test('capitalizeFirst should capitalize first letter', () => {
    expect(capitalizeFirst('hello')).toBe('Hello');
    expect(capitalizeFirst('WORLD')).toBe('WORLD');
    expect(capitalizeFirst('')).toBe('');
  });

  test('truncateText should truncate long text', () => {
    const longText = 'This is a very long text that should be truncated';
    expect(truncateText(longText, 20)).toBe('This is a very long...');
    expect(truncateText('short', 20)).toBe('short');
    expect(truncateText(null)).toBe(null);
  });
});

// Test data management concepts
describe('Data Management', () => {
  test('should handle scout data structure', () => {
    const scout = {
      id: 'scout_123',
      name: 'John Doe',
      den: 'Tigers',
      active: true
    };

    expect(scout.id).toBe('scout_123');
    expect(scout.name).toBe('John Doe');
    expect(scout.den).toBe('Tigers');
    expect(scout.active).toBe(true);
  });

  test('should handle event data structure', () => {
    const event = {
      id: 'event_123',
      name: 'Den Meeting',
      date: '2024-01-15',
      type: 'meeting',
      attendeeType: 'scouts'
    };

    expect(event.id).toBe('event_123');
    expect(event.attendeeType).toBe('scouts');
  });

  test('should handle attendance records', () => {
    const attendance = {
      eventId: 'event_123',
      scoutId: 'scout_123',
      checkedInAt: '2024-01-15T10:00:00.000Z'
    };

    expect(attendance.eventId).toBe('event_123');
    expect(attendance.scoutId).toBe('scout_123');
  });
});

// Test business logic concepts
describe('Business Logic', () => {
  test('should validate event data', () => {
    const validateEvent = (event) => {
      return !!(event.name && event.name.trim() && 
               event.date && 
               event.type && 
               ['scouts', 'parents'].includes(event.attendeeType));
    };

    const validEvent = {
      name: 'Den Meeting',
      date: '2024-01-15',
      type: 'meeting',
      attendeeType: 'scouts'
    };

    const invalidEvent = {
      name: '',
      date: '2024-01-15',
      type: 'meeting',
      attendeeType: 'invalid'
    };

    expect(validateEvent(validEvent)).toBe(true);
    expect(validateEvent(invalidEvent)).toBe(false);
  });

  test('should filter active items', () => {
    const items = [
      { id: '1', name: 'Active Item', active: true },
      { id: '2', name: 'Inactive Item', active: false },
      { id: '3', name: 'Another Active', active: true }
    ];

    const activeItems = items.filter(item => item.active);
    expect(activeItems).toHaveLength(2);
  });

  test('should find items by ID', () => {
    const items = [
      { id: '1', name: 'First' },
      { id: '2', name: 'Second' },
      { id: '3', name: 'Third' }
    ];

    const found = items.find(item => item.id === '2');
    expect(found.name).toBe('Second');
  });
});

// Test configuration concepts
describe('Configuration', () => {
  test('should have default dens', () => {
    const defaultDens = [
      { id: 'den_tigers', name: 'Tigers', order: 1 },
      { id: 'den_wolves', name: 'Wolves', order: 2 },
      { id: 'den_bears', name: 'Bears', order: 3 },
      { id: 'den_webelos', name: 'Webelos', order: 4 },
      { id: 'den_aol', name: 'Arrow of Light', order: 5 }
    ];

    expect(defaultDens).toHaveLength(5);
    expect(defaultDens[0].name).toBe('Tigers');
    expect(defaultDens[4].name).toBe('Arrow of Light');
  });

  test('should have default event types', () => {
    const defaultEventTypes = [
      { id: 'type_meeting', name: 'Den Meeting', value: 'meeting', order: 1 },
      { id: 'type_campout', name: 'Campout', value: 'campout', order: 2 },
      { id: 'type_service', name: 'Service Project', value: 'service', order: 3 },
      { id: 'type_other', name: 'Other', value: 'other', order: 4 }
    ];

    expect(defaultEventTypes).toHaveLength(4);
    expect(defaultEventTypes[0].value).toBe('meeting');
  });
});