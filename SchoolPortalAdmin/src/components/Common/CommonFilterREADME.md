# CommonFilter Component

A reusable filter component based on the createExamTab.js pattern that provides academic year, grade, gender, and section filtering capabilities.

## Features

- ✅ **Academic Year Selection**: Fetches and displays academic years from API
- ✅ **Grade Selection**: Dynamically loads grades based on selected academic year
- ✅ **Gender Selection**: Optional gender filter (Male/Female)
- ✅ **Section Selection**: Dynamically loads sections based on selected grade
- ✅ **API Integration**: Uses the same API patterns as createExamTab.js
- ✅ **Form Validation**: Built-in validation using Yup schema
- ✅ **Responsive Design**: Adapts to different screen sizes
- ✅ **Theme Support**: Automatically adapts to theme colors
- ✅ **Loading States**: Shows loading indicators during API calls

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `hide` | boolean | false | Hide/show the filter component |
| `onFilterChange` | function | - | Callback when filter values change |
| `initialValues` | object | {} | Initial form values |
| `onSelectionChange` | function | - | Callback when selections change |
| `title` | string | - | Title displayed at the top |
| `showGender` | boolean | true | Show/hide gender field |
| `showSection` | boolean | true | Show/hide section field |
| `showSubmit` | boolean | false | Show/hide submit button |
| `submitLabel` | string | 'Apply Filter' | Text for submit button |
| `onSubmit` | function | - | Callback when form is submitted |
| `resetRoute` | string | - | Route to navigate to on reset |
| `onHide` | function | - | Callback when component should hide |

## Usage Examples

### Basic Usage (All Fields)
```jsx
import CommonFilter from './CommonFilter';

const MyComponent = () => {
    const handleFilterChange = (data) => {
        console.log('Filter changed:', data);
    };

    return (
        <CommonFilter
            title="Student Filter"
            onFilterChange={handleFilterChange}
            showSubmit={true}
            submitLabel="Apply Filter"
        />
    );
};
```

### Attendance Filter (No Section)
```jsx
<CommonFilter
    title="Attendance Filter"
    onFilterChange={handleFilterChange}
    showSection={false}
    showSubmit={false}
/>
```

### Grade Filter Only
```jsx
<CommonFilter
    title="Grade Filter"
    onFilterChange={handleFilterChange}
    showGender={false}
    showSection={false}
    showSubmit={false}
/>
```

### With Initial Values
```jsx
const initialValues = {
    academic_id: { _id: '123', academicYear: '2024-2025' },
    grade_id: { _id: '456', gradeName: 'Grade 10' },
    gender: 'male',
    section: 'section1'
};

<CommonFilter
    title="Filter with Initial Values"
    initialValues={initialValues}
    onFilterChange={handleFilterChange}
    showSubmit={true}
    submitLabel="Update Filter"
/>
```

### With Selection Tracking
```jsx
const handleSelectionChange = ({ title, values }) => {
    console.log('Selection changed:', { title, values });
};

<CommonFilter
    title="Filter with Selection Tracking"
    onSelectionChange={handleSelectionChange}
    showSubmit={false}
/>
```

## Data Structure

### Filter Change Callback
```javascript
{
    academic_id: { _id: '123', academicYear: '2024-2025' },
    grade_id: { _id: '456', gradeName: 'Grade 10' },
    gender: 'male',
    section: 'section1'
}
```

### Selection Change Callback
```javascript
{
    title: '2024-2025 • Grade 10 • male • Section A',
    values: {
        year: { _id: '123', academicYear: '2024-2025' },
        grade: { _id: '456', gradeName: 'Grade 10' },
        gender: 'male',
        section: 'section1'
    }
}
```

## API Integration

The component automatically handles:
- Fetching academic years on component mount
- Loading grades when academic year changes
- Loading sections when grade changes
- Caching API responses to prevent duplicate calls

## Styling

The component uses:
- Material-UI components for consistent styling
- Theme colors from the theme context
- Responsive grid layout
- Hover effects and transitions
- Loading indicators during API calls

## Dependencies

- React Hook Form for form management
- Yup for validation
- Material-UI for UI components
- Redux Toolkit Query for API calls

## Notes

- The component follows the exact same pattern as createExamTab.js
- All API calls are cached and optimized
- Form validation is built-in and customizable
- The component is fully responsive and theme-aware


