# React Migration - Quick Start Guide

## ✅ Migration Complete!

Your HTML/JS prototype has been successfully migrated to a production-ready React + Vite application.

## 📁 What Was Created

### Core Application Files
- `src/App.jsx` - Main app component with tab navigation
- `src/main.jsx` - Entry point (already configured)
- `src/index.css` - Global styles with Tailwind
- `src/App.css` - Minimal app-specific styles

### Context & State Management
- `src/context/UserContext.jsx` - Global user state provider
- `src/hooks/useUser.js` - Hook to access user context
- `src/hooks/useAutoNom.js` - API and workflow management hook

### Components

#### Layout
- `src/components/Header.jsx` - App header with user selector

#### Profile Tab
- `src/components/tabs/ProfileTab.jsx` - Main profile tab
- `src/components/profile/DaySelector.jsx` - Day selection component
- `src/components/profile/MealSlotList.jsx` - Meal slots list
- `src/components/profile/MealSlotItem.jsx` - Individual meal slot
- `src/components/profile/PreferenceInput.jsx` - Preference tags input
- `src/components/profile/AllergyGrid.jsx` - Allergies grid selector

#### Meals Tab
- `src/components/tabs/MealsTab.jsx` - Main meals tab
- `src/components/meals/MealRoutineCard.jsx` - Meal routine card

#### Status Tab
- `src/components/tabs/StatusTab.jsx` - Main status tab with polling
- `src/components/status/StatusCard.jsx` - Expandable status card
- `src/components/status/EventStream.jsx` - Event log display
- `src/components/status/SelectionModal.jsx` - User approval modal

### Utilities
- `src/utils/constants.js` - App constants (days, allergies, workflow statuses)

### Configuration Files
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration (updated for new Tailwind)
- `vite.config.js` - Already configured with proxy

## 🚀 How to Run

### 1. Development Mode

```bash
cd frontend
npm run dev
```

This will start the dev server at `http://localhost:5173` with:
- Hot Module Replacement (HMR)
- API proxy to `http://127.0.0.1:8000`

### 2. Production Build

```bash
cd frontend
npm run build
```

This builds the app to `../src/static/` directory, which your Python FastAPI server already serves.

### 3. Test Full Stack

**Terminal 1 - Start Python Backend:**
```bash
# From project root
python src/server.py
# or
uvicorn src.server:app --reload
```

**Terminal 2 - Start React Dev Server:**
```bash
cd frontend
npm run dev
```

Then open `http://localhost:5173` in your browser.

## 🔄 Key Differences from Original

### State Management
**Before (HTML/JS):**
```javascript
const AppState = {
    users: [],
    currentUser: null,
    // ...
}
```

**After (React):**
```jsx
// UserContext provides:
const { 
  users, 
  currentUser, 
  selectUser, 
  getUserById,
  // ... 
} = useUser();
```

### API Calls
**Before (HTML/JS):**
```javascript
async function triggerPlan(userId, mealType) {
    const response = await fetch('/api/trigger', {
        method: 'POST',
        // ...
    });
}
```

**After (React):**
```jsx
const { triggerPlan } = useAutoNom();

await triggerPlan(
  userId,
  mealType,
  onEvent,
  onComplete,
  onError
);
```

### Event Stream
**Before (HTML/JS):**
```javascript
const reader = response.body.getReader();
// Manual stream reading...
```

**After (React):**
```jsx
// useAutoNom hook handles streaming internally
// Events automatically update eventLog state
const { eventLog } = useAutoNom();
```

## 📦 Dependencies Added

```json
{
  "dependencies": {
    "axios": "^1.x.x",           // HTTP client
    "lucide-react": "^0.x.x",    // Icons
    "marked": "^x.x.x",          // Markdown parser
    "zustand": "^4.x.x"          // State management
  },
  "devDependencies": {
    "tailwindcss": "^4.1.x",     // Tailwind CSS v4
    "@tailwindcss/postcss": "^4.1.x",
    "autoprefixer": "^10.x.x"
  }
}
```

**Note**: This project uses Tailwind CSS v4, which has a different configuration approach than v3. Instead of `tailwind.config.js`, theme customization is done directly in CSS using the `@theme` directive.

## 🎨 Styling

All Tailwind utility classes work as before. Custom animations from your original CSS are preserved in `index.css`:

- `.fade-in` - Fade in animation
- `.animate-fade-in` - Animated fade in
- `.celebration-bounce` - Celebration animation
- `.prose-invert` - Markdown styling

## 🔌 API Endpoints

The React app uses the same endpoints as your original HTML/JS app:

- ✅ `GET /api/users`
- ✅ `POST /api/users`
- ✅ `POST /api/trigger` (SSE)
- ✅ `GET /api/sessions/active/{userId}`
- ✅ `GET /api/sessions/{userId}/{sessionId}/state`
- ✅ `POST /api/user_approval`

## 🐛 Troubleshooting

### Port Already in Use
If port 5173 is in use:
```bash
npm run dev -- --port 3000
```

### Build Fails
Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### API Not Working
Make sure Python backend is running on port 8000:
```bash
curl http://127.0.0.1:8000/api/users
```

### Styles Not Loading
Make sure Tailwind is properly configured:
```bash
# Check if @tailwindcss/postcss is installed
npm list @tailwindcss/postcss
```

## 📝 Next Steps

1. **Test All Features**: Go through the app and test each feature
2. **Check Console**: Look for any warnings or errors
3. **Review Code**: Familiarize yourself with the new structure
4. **Customize**: Make any adjustments to styling or behavior
5. **Deploy**: Build and deploy to production

## 🎯 Feature Parity Checklist

- ✅ User selection dropdown
- ✅ Create new user
- ✅ Profile management (name, days, meals, preferences, allergies)
- ✅ Save profile to API
- ✅ Display meal routines
- ✅ Trigger meal planning
- ✅ Real-time event streaming
- ✅ User approval modal
- ✅ Order confirmation celebration
- ✅ Active session polling
- ✅ Session state monitoring

## 💡 Pro Tips

1. **Use React DevTools**: Install the React DevTools browser extension to inspect component state
2. **Hot Reload**: The dev server automatically reloads on file changes
3. **Console Logging**: Check browser console for event streaming logs
4. **Network Tab**: Use browser DevTools Network tab to monitor API calls
5. **State Management**: Use React DevTools to inspect UserContext state

## 📚 Further Reading

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)

---

**Need help?** Check the component files - they're well-commented and follow React best practices!
