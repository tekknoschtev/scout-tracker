# Scout Pack Attendance App

A simple, offline-capable web application for tracking Cub Scout attendance at meetings and events. Designed for single-device use with easy check-in workflow and comprehensive data management.

## 🏕️ Overview

This application helps Cub Scout pack leaders manage attendance efficiently with a focus on simplicity and user experience. Scouts and parents can check in with a single tap, while leaders get powerful tools for managing events, scouts, and attendance data.

## ✨ Key Features

### 📋 **Check-In System**
- **One-tap check-in** - No buttons needed, just tap your name
- **Real-time updates** - Counters and displays update instantly
- **Den grouping** - Scouts organized by den (Tigers, Wolves, Bears, Webelos, AOL)
- **Den filtering** - Show only specific dens for den-specific activities
- **Visual feedback** - Clear distinction between available and checked-in scouts
- **Undo functionality** - Easy correction of check-in mistakes
- **Special instructions** - Display event-specific instructions after check-in

### 👥 **Scout Management**
- **Add/remove scouts** with name and den assignment
- **Den-based organization** with automatic sorting
- **Filter by den** for easy management
- **Visual den grouping** with scout counts
- **Inactive scout handling** (soft delete)

### 📅 **Event Management**
- **Create events** with name, date, type, description, and instructions
- **Edit/delete events** with confirmation dialogs
- **Event types**: Meeting, Campout, Service Project, Other
- **Past event toggle** - Show/hide completed events
- **Smart event filtering** - Upcoming events prioritized
- **Expandable attendee lists** - See who attended each event

### 📊 **Data Management**
- **CSV export** - Download attendance data for spreadsheets
- **Backup/restore** - JSON backup files for data safety
- **Local storage** - All data stored locally on device
- **Offline operation** - Works without internet connection

### 🎨 **User Interface**
- **Mobile-responsive design** - Works on tablets, laptops, phones
- **Custom notifications** - No intrusive browser alerts
- **Confirmation modals** - User-friendly confirmation dialogs
- **Intuitive navigation** - Clean, Scout-themed design
- **Accessibility features** - Proper contrast, touch targets

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No internet connection required after initial load

### Installation
1. Download all files to a folder
2. Open `index.html` in a web browser
3. Start using immediately - no setup required!

### First Use
1. **Add Scouts**: Click Admin → Manage Scouts → Add scouts with names and dens
2. **Create Event**: Click Admin → + New Event → Fill in event details
3. **Check In**: Switch to Check In tab → Select event → Tap scout names to check in

## 📱 Usage Guide

### For Leaders (Admin View)
- **Manage Scouts**: Add new scouts, organize by den, remove inactive scouts
- **Create Events**: Set up meetings, campouts, and activities with instructions
- **View Reports**: See attendance counts and expandable attendee lists
- **Export Data**: Download CSV files or create JSON backups
- **Edit Events**: Update event details or delete old events

### For Scouts/Parents (Check In View)
- **Select Event**: Choose from today's available events
- **Read Instructions**: Review any special instructions for the event
- **Check In**: Simply tap your name to check in instantly
- **Confirmation**: See success notification confirming attendance

### For Event Management
- **Den Filtering**: Show only specific dens during den meetings
- **Undo Check-ins**: Easily correct mistakes with undo buttons
- **Real-time Updates**: See attendance counts update as scouts arrive
- **Past Events**: Toggle to view historical events and attendance

## 🗂️ File Structure

```
scout-attendance/
├── index.html          # Main application file
├── css/
│   └── styles.css      # Application styling
├── js/
│   ├── app.js          # Main application entry point
│   ├── Utils.js        # Utility functions
│   ├── DataManager.js  # Data persistence and operations
│   ├── UIManager.js    # DOM interactions and modals
│   ├── EventManager.js # Event creation and management
│   ├── AttendanceManager.js # Check-in/out logic
│   ├── NotificationManager.js # User notifications
│   ├── RenderManager.js # View rendering
│   ├── ConfigManager.js # Default configurations
│   ├── ScoutManager.js  # Scout management
│   └── DenEventTypeManager.js # Den and event type management
├── tests/              # Test suite
│   ├── setup/          # Test configuration
│   ├── utils/          # Test utilities and helpers
│   ├── managers/       # Unit tests for manager classes
│   └── integration/    # Integration tests
├── .github/
│   └── workflows/
│       └── test.yml    # GitHub Actions CI
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## 💾 Data Storage

### Local Storage Keys
- `scouts` - Array of scout objects with id, name, den, active status
- `events` - Array of event objects with details and instructions  
- `attendance` - Array of attendance records linking scouts to events

### Data Format
```javascript
// Scout object
{
  id: "scout_123456789",
  name: "Tommy Smith", 
  den: "Tigers",
  active: true
}

// Event object  
{
  id: "event_123456789",
  name: "Den Meeting",
  date: "2025-08-01", 
  type: "meeting",
  description: "Regular weekly meeting",
  instructions: "Meet in the main hall after check-in"
}

// Attendance record
{
  eventId: "event_123456789",
  scoutId: "scout_123456789", 
  checkedInAt: "2025-08-01T18:30:00.000Z"
}
```

## 🔧 Technical Details

### Built With
- **HTML5** - Semantic structure
- **CSS3** - Responsive design with Flexbox/Grid
- **Vanilla JavaScript** - No frameworks, maximum compatibility
- **Local Storage API** - Client-side data persistence
- **File API** - CSV export and JSON backup functionality

### Browser Compatibility
- Chrome 60+
- Firefox 55+  
- Safari 12+
- Edge 79+

### Development Features
- **Test-Driven Development** with comprehensive Jest test suite
- **Modular Architecture** with specialized manager classes
- **ES6+ JavaScript** with modern syntax
- **Mobile-first responsive design**
- **Accessibility considerations** throughout
- **CI/CD Pipeline** with GitHub Actions
- **Code Coverage** reporting and monitoring

## 🎯 Use Cases

### Perfect For:
- **Cub Scout pack meetings** - Weekly den meetings and pack gatherings
- **Special events** - Campouts, service projects, field trips
- **Single-device check-in** - One tablet/laptop at event entrance
- **Offline events** - No internet required at meeting locations
- **Small to medium packs** - Optimized for typical pack sizes

### Deployment Options:
- **Local file** - Open HTML file directly in browser
- **GitHub Pages** - Host for free with git integration
- **Netlify/Vercel** - Free static hosting with easy updates
- **Local server** - Python's `http.server` or similar

## 🔒 Privacy & Security

- **No data transmission** - All data stays on the device
- **No user accounts** - No login or personal information required
- **Local storage only** - Data never leaves the browser
- **Export control** - Users control their own data exports

## 🚀 Development Journey

This application was built iteratively with focus on user experience:

### Phase 1: Core Functionality
- ✅ Basic HTML structure and styling
- ✅ Scout and event management
- ✅ Simple check-in workflow
- ✅ Local storage persistence

### Phase 2: Enhanced UX  
- ✅ Den-based organization and filtering
- ✅ One-tap check-in system
- ✅ Custom notifications and confirmations
- ✅ Mobile-responsive design

### Phase 3: Advanced Features
- ✅ Undo check-in functionality  
- ✅ Event instructions display
- ✅ Past event management
- ✅ CSV export and data backup
- ✅ Comprehensive error handling

### Phase 4: Modular Refactoring & Testing
- ✅ Modular architecture with 9 specialized managers
- ✅ Comprehensive unit and integration test suite
- ✅ Consistent design language
- ✅ Performance optimizations
- ✅ Accessibility improvements
- ✅ CI/CD pipeline with GitHub Actions

## 🧪 Testing

The application includes a comprehensive test suite covering:

### Unit Tests
- **Utils**: Date formatting, validation, and utility functions
- **DataManager**: localStorage operations, CSV export, data migration
- **EventManager**: Event creation, validation, and management logic
- **AttendanceManager**: Check-in/out workflows and attendance tracking
- **ConfigManager**: Default configurations and sample data generation

### Integration Tests
- **ScoutAttendanceApp**: End-to-end application flow and manager coordination

### Running Tests
```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode  
npm run test:watch

# Generate coverage report
npm run test:coverage

# Serve app locally for testing
npm run serve
```

### Coverage Goals
- **Business Logic**: 90%+ coverage for core managers
- **Utility Functions**: 95%+ coverage for Utils class
- **Integration**: Key user workflows tested end-to-end

## 🤝 Contributing

This is a focused single-purpose application. The codebase prioritizes:
- **Simplicity** over feature complexity
- **Reliability** over cutting-edge tech
- **Usability** over advanced functionality  
- **Offline capability** over cloud features
- **Test Coverage** over rapid feature development

## 📄 License

This project is designed for Cub Scout pack use and community benefit.

## 🎉 Acknowledgments

Built with the needs of Cub Scout leaders in mind, focusing on simplicity, reliability, and ease of use for busy pack meeting scenarios.

---

**Ready to help your pack track attendance efficiently!** 🏕️✨