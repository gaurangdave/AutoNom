# Auto-Nom React - Quick Reference Card

## 🚀 Start Commands

```bash
# Development
cd frontend && npm run dev

# Production Build
cd frontend && npm run build

# Preview Build
cd frontend && npm run preview
```

## 📦 Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main app with tab navigation |
| `src/context/UserContext.jsx` | Global state provider |
| `src/hooks/useUser.js` | User state hook |
| `src/hooks/useAutoNom.js` | API & streaming hook |

## 🎨 Component Map

### Tabs
```
ProfileTab.jsx → User profile management
MealsTab.jsx   → Meal routines display  
StatusTab.jsx  → Real-time status & events
```

### Profile Components
```
DaySelector.jsx      → M T W T F S S selector
MealSlotList.jsx     → Meal time slots
PreferenceInput.jsx  → Preference tags
AllergyGrid.jsx      → Allergy selection
```

### Status Components
```
StatusCard.jsx      → Expandable status display
EventStream.jsx     → Live event feed
SelectionModal.jsx  → User approval dialog
```

## 🔌 API Endpoints

```javascript
GET  /api/users                                 // Fetch all users
POST /api/users                                 // Save user
POST /api/trigger                               // Start planning (SSE)
GET  /api/sessions/active/{userId}              // Check sessions
GET  /api/sessions/{userId}/{sessionId}/state   // Get state
POST /api/user_approval                         // Submit response
```

## 🪝 Custom Hooks Usage

### useUser
```jsx
const { 
  users,                    // All users
  currentUser,              // Selected user
  selectUser,               // Change user
  getUserById,              // Get user by ID
  getUserPreferences,       // Get preferences
  getUserAllergies,         // Get allergies
  // ...
} = useUser();
```

### useAutoNom
```jsx
const {
  isProcessing,             // Is workflow active?
  eventLog,                 // Event history
  currentSessionId,         // Active session
  fetchUsers,               // Load users
  saveUserToAPI,            // Save profile
  triggerPlan,              // Start planning
  submitUserResponse,       // Respond to approval
  // ...
} = useAutoNom();
```

## 🎯 Common Tasks

### Add User
```jsx
const { selectUser } = useUser();
selectUser('create_new');
```

### Save Profile
```jsx
const { saveUserToAPI } = useAutoNom();
const userData = { user_id, name, meals, ... };
await saveUserToAPI(userData);
```

### Trigger Planning
```jsx
const { triggerPlan } = useAutoNom();
await triggerPlan(
  userId,
  mealType,
  (event) => console.log(event),  // onEvent
  () => console.log('Done'),       // onComplete  
  (err) => console.error(err)      // onError
);
```

### Submit Approval
```jsx
const { submitUserResponse } = useAutoNom();
await submitUserResponse(userId, sessionId, response);
```

## 🎨 Styling Helpers

### Tailwind Classes
```
bg-slate-900        // Dark background
bg-slate-800        // Card background  
border-slate-700    // Borders
text-slate-200      // Primary text
text-primary-500    // Accent blue
```

### Custom Animations
```
.fade-in               // Fade in on mount
.animate-fade-in       // Animated fade
.celebration-bounce    // Celebration effect
.prose-invert         // Markdown styles
```

## 🐛 Debug Tips

### Check Events
```jsx
const { eventLog } = useAutoNom();
console.log('Events:', eventLog);
```

### Check User State
```jsx
const { currentUser } = useUser();
console.log('User:', currentUser);
```

### Check Session
```jsx
const { currentSessionId } = useAutoNom();
console.log('Session:', currentSessionId);
```

## 📂 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── tabs/          (3 files)
│   │   ├── profile/       (5 files)
│   │   ├── meals/         (1 file)
│   │   └── status/        (3 files)
│   ├── context/           (UserContext)
│   ├── hooks/             (useUser, useAutoNom)
│   ├── utils/             (constants)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── package.json
```

## 🔧 Configuration

### Vite Proxy
```javascript
// vite.config.js
server: {
  proxy: {
    '/api': 'http://127.0.0.1:8000'
  }
}
```

### Tailwind Theme
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: { 500: '#3b82f6' }
    }
  }
}
```

## ✅ Feature Checklist

- ✅ User CRUD operations
- ✅ Profile management
- ✅ Day & meal selection
- ✅ Preferences & allergies
- ✅ Meal planning trigger
- ✅ Real-time event stream
- ✅ User approval flow
- ✅ Order confirmation
- ✅ Session polling
- ✅ State persistence

## 📚 Documentation

- `MIGRATION_GUIDE.md` - How to get started
- `REACT_MIGRATION_SUMMARY.md` - Complete overview
- `frontend/README.md` - Technical details
- Component files - Inline comments

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | `npm run dev -- --port 3000` |
| Build fails | `rm -rf node_modules && npm install` |
| API errors | Check Python backend is running |
| No styles | Verify Tailwind config |
| No events | Check console for errors |

## 💡 Pro Tips

1. Use React DevTools browser extension
2. Check Network tab for API calls
3. Console logs show event streaming
4. State updates are logged in dev mode
5. HMR updates instantly on save

---

**Quick Help**: Check `MIGRATION_GUIDE.md` for detailed instructions!
