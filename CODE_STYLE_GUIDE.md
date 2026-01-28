# Code Style Guide

Coding standards and best practices for yt-emotion.

---

## General Principles

1. **Readability First**: Code is read more often than written
2. **Consistency**: Follow existing patterns in the codebase
3. **Self-Documenting**: Clear variable/function names reduce need for comments
4. **DRY (Don't Repeat Yourself)**: Extract reusable code into functions/components
5. **SOLID Principles**: Write modular, maintainable code

---

## JavaScript/JSX

### File Structure

```javascript
// 1. Imports (external libraries first, then local)
import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/Button";

// 2. Types/Constants (at module level)
const API_BASE = "https://api.example.com";

// 3. Component Definition
export default function MyComponent({ prop1, prop2 }) {
  // 4. Hooks
  const [state, setState] = useState();

  // 5. Functions
  const handleClick = () => {};

  // 6. Effects
  useEffect(() => {}, []);

  // 7. Render
  return <div>Content</div>;
}
```

### Naming Conventions

```javascript
// ✅ Components: PascalCase
function UserProfile() {}

// ✅ Variables/Functions: camelCase
const userName = "John";
const calculateTotal = () => {};

// ✅ Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_URL = "https://api.example.com";

// ✅ Event handlers: on + PascalCase (e.g., onClick, onChange)
const handleClick = () => {};
const handleInputChange = (value) => {};
```

### Comments

```javascript
// ✅ Use JSDoc for complex functions
/**
 * Analyze emotion of text using local or fallback API
 * @param {string} text - Text to analyze (max 512 chars)
 * @returns {Promise<{label: string, score: number}>}
 * @throws {Error} If analysis fails on all retries
 */
export async function analyzeEmotion(text) {
  // ...
}

// ✅ Explain WHY, not WHAT
// Use local server first for instant analysis (10-50ms vs 1-3s HF API)
try {
  const response = await fetch(`${LOCAL_API_URL}/analyze`, {
    // ...
  });
}

// ❌ Avoid obvious comments
const name = "John"; // Set name to John
```

### Error Handling

```javascript
// ✅ Graceful degradation
try {
  const result = await analyzeEmotion(text);
  return result;
} catch (error) {
  console.error("Emotion analysis failed:", error);
  return { label: "neutral", score: 0 }; // Fallback
}

// ✅ Specific error messages
if (!session?.accessToken) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Please sign in to access YouTube data",
    }),
    { status: 401 },
  );
}

// ❌ Avoid generic errors
// if (!result) throw new Error("Error"); // Too vague
```

### Async/Await

```javascript
// ✅ Use async/await (more readable than .then())
async function fetchData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch:", error);
  }
}

// ✅ Parallel requests when possible
const [videos, comments] = await Promise.all([fetchVideos(), fetchComments()]);
```

---

## React Components

### Function Components Only

```javascript
// ✅ Modern: Function component with hooks
export default function MyComponent() {
  const [state, setState] = useState();
  return <div>Content</div>;
}

// ❌ Avoid: Class components (legacy)
// class MyComponent extends React.Component { ... }
```

### Prop Validation

```javascript
// ✅ Use default parameters
export default function EmotionChart({ data = {}, title = "Emotions" }) {
  return <div>{title}</div>;
}

// ✅ Optional JSDoc for props
/**
 * @param {Object} emotionData - Object with emotion keys and counts
 * @param {string} title - Chart title
 */
export default function EmotionChart({ emotionData, title }) {
  // ...
}
```

### Performance

```javascript
// ✅ Use useCallback for memoized functions
const handleClick = useCallback(() => {
  // Function body
}, [dependency]);

// ✅ Use useMemo for expensive computations
const chartData = useMemo(() => {
  return transformData(emotionData);
}, [emotionData]);

// ✅ Lazy load components when possible
const HeavyChart = lazy(() => import("./HeavyChart"));
```

### Event Handlers

```javascript
// ✅ Use arrow functions for correct `this` binding
const handleSubmit = async (e) => {
  e.preventDefault();
  await submitData();
};

// ✅ Pass event object directly
<input onChange={(e) => setValue(e.target.value)} />;

// ❌ Avoid: Creating new functions in render
// <button onClick={() => handleClick()}>Click</button> // Re-creates function each render
```

---

## API Routes (Next.js)

### Structure

```javascript
/**
 * GET /api/endpoint
 * Description of what this endpoint does
 * Required query params/body
 * Response format
 */

import { getServerSession } from "next-auth";
import { authOptions } from "../auth/route";

export async function GET(request) {
  // 1. Authenticate
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 2. Validate input
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");
    if (!videoId) {
      return new Response(JSON.stringify({ error: "Missing videoId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Fetch/process data
    const data = await fetchData(videoId);

    // 4. Return response
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 5. Error handling
    console.error("API error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

### Response Format

```javascript
// ✅ Consistent response format
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation successful"
}

// ✅ Error response
{
  "error": "BadRequest",
  "message": "Validation failed",
  "details": "videoId is required"
}

// Headers
{
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=300",
}
```

---

## Styling (Tailwind CSS)

### Class Organization

```jsx
// ✅ Order: Layout → Box Model → Text → Visual → Animation
<div className="flex items-center justify-center gap-4 p-4 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all">
  Content
</div>;

// ✅ Extract complex styles into components
const ButtonContainer = ({ children }) => (
  <div className="flex gap-2 p-4 bg-blue-50 rounded-lg">{children}</div>
);
```

### Responsive Design

```jsx
// ✅ Mobile-first approach
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
</div>
```

---

## Commits & Git

### Commit Messages

```
// ✅ Format: type(scope): description
feat(api): add comment analysis endpoint
fix(ui): correct emotion pie chart colors
docs: update deployment guide
chore: update dependencies

// ✅ Use imperative mood
Add emotion analysis feature
Update color configuration
Remove unused imports

// ❌ Avoid vague messages
Fixed stuff
Update code
Changes
```

### Branch Naming

```
feature/emotion-chart-ui
fix/auth-token-expiration
docs/deployment-guide
chore/dependency-updates
```

---

## Testing

### Unit Tests (if applicable)

```javascript
// ✅ Clear test names describing behavior
test("analyzeEmotion returns joy for positive text", async () => {
  const result = await analyzeEmotion("I love this!");
  expect(result.label).toBe("joy");
});

// ✅ Arrange-Act-Assert pattern
test("handles empty text gracefully", async () => {
  // Arrange
  const emptyText = "";

  // Act
  const result = await analyzeEmotion(emptyText);

  // Assert
  expect(result.label).toBe("neutral");
});
```

---

## Performance Tips

1. **Image Optimization**: Use Next.js Image component
2. **Code Splitting**: Lazy load components with `lazy()` and `Suspense`
3. **Memoization**: Use `useMemo` for expensive computations
4. **Debouncing**: Debounce search inputs and API calls
5. **Caching**: Use `Cache-Control` headers appropriately
6. **Bundle Analysis**: Monitor bundle size with `next/bundle-analyzer`

---

## Accessibility (a11y)

```jsx
// ✅ Semantic HTML
<button aria-label="Analyze comments">Analyze</button>
<nav aria-label="Main navigation">Navigation</nav>

// ✅ Keyboard navigation
<input onKeyPress={(e) => e.key === "Enter" && handleSubmit()} />

// ✅ Color not the only indicator
<p className="text-red-600 font-bold">Error: {message}</p>

// ✅ Alt text for images
<img src="chart.png" alt="Emotion distribution pie chart" />
```

---

## Security Best Practices

1. **Never expose secrets**: Keep API keys on server only
2. **Validate input**: Always validate user input on server
3. **HTTPS only**: Use secure connections
4. **CORS**: Configure properly
5. **Rate limiting**: Implement when possible
6. **SQL injection**: Use parameterized queries (if using DB)

---

## Dependencies

### Preferred Libraries

✅ **Recommended**

- `next`: Web framework
- `next-auth`: Authentication
- `axios`: HTTP client
- `recharts`: Data visualization
- `tailwindcss`: Styling
- `framer-motion`: Animations
- `lucide-react`: Icons

⚠️ **Think twice before adding**

- Large bundlesize packages
- Redundant libraries (duplicate functionality)
- Unmaintained packages

---

## Before Deploying

- [ ] No `console.log` in production code
- [ ] All environment variables set
- [ ] No hardcoded credentials
- [ ] Tests passing (if applicable)
- [ ] Linter passing (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No security vulnerabilities (`npm audit`)

---

## Resources

- [Next.js Best Practices](https://nextjs.org/docs/app/building-your-application/rendering)
- [React Hooks Rules](https://react.dev/reference/react/hooks)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/)
