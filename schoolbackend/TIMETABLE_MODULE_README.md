# Timetable Module

## Overview
The Timetable Module provides comprehensive functionality for creating, managing, and viewing school timetables. It integrates with the existing Settings module's school timings and GradeSubject module to ensure proper subject and teacher assignments.

## Features
- **Individual Class Timetables**: Create timetables for specific grade, gender, section combinations
- **School Timing Integration**: Automatically uses school timing settings from the Settings module
- **Subject-Teacher Validation**: Ensures only assigned subjects and teachers are used
- **Flexible Period Management**: Support for different period durations, breaks, and timing overrides
- **Weekly Structure**: Full weekly timetable with support for all days
- **Template Generation**: Auto-generate timetable templates based on school timings
- **Status Management**: Draft, published, and archived timetable states

## Models

### Timetable Model (`/models/Admin/Timetable.js`)
- **academicYear**: Reference to AcademicYear
- **term**: Term (e.g., "Term 1", "Term 2")
- **grade**: Reference to Grade
- **gender**: "male" or "female"
- **section**: Reference to Section
- **weeklyTimetable**: Object containing timetable for each day of the week
- **status**: "draft", "published", or "archived"
- **createdBy/updatedBy**: User references for audit trail

### Weekly Timetable Structure
Each day contains an array of periods with:
- **period**: Period number (1-15)
- **subject**: Reference to Subject
- **teacher**: Reference to Teacher
- **startTime/endTime**: Time in HH:MM format
- **duration**: Duration in minutes
- **room**: Optional room assignment
- **isBreak**: Boolean for break periods
- **breakType**: "lunch", "short", or "assembly"

## API Endpoints

### Base URL: `/api/v1/admin/timetable`

#### 1. Create Timetable
```
POST /
```
**Body:**
```json
{
  "academicYear": "ObjectId",
  "term": "Term 1",
  "grade": "ObjectId",
  "gender": "male",
  "section": "ObjectId",
  "weeklyTimetable": {
    "monday": [
      {
        "period": 1,
        "subject": "ObjectId",
        "teacher": "ObjectId",
        "startTime": "08:00",
        "endTime": "08:45",
        "duration": 45,
        "room": "Room 101",
        "isBreak": false
      }
    ]
  },
  "status": "draft",
  "notes": "Optional notes"
}
```

#### 2. Get All Timetables
```
GET /
```
**Query Parameters:**
- `academicYear`: Filter by academic year
- `term`: Filter by term
- `grade`: Filter by grade
- `gender`: Filter by gender
- `section`: Filter by section
- `status`: Filter by status
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### 3. Get Specific Timetable
```
GET /:id
```

#### 4. Update Timetable
```
PATCH /:id
```

#### 5. Delete Timetable
```
DELETE /:id
```

#### 6. Get Available Subjects and Teachers
```
GET /available-subjects-teachers?academicYear=ObjectId&grade=ObjectId&gender=male&section=ObjectId
```
Returns subjects and teachers available for the specified class.

#### 7. Get School Timings for Timetable
```
GET /school-timings?gradeId=ObjectId&gender=male
```
Returns school timings with any grade/gender specific overrides.

#### 8. Generate Timetable Template
```
GET /generate-template?academicYear=ObjectId&grade=ObjectId&gender=male&section=ObjectId
```
Generates a timetable template with:
- Time slots based on school timings
- Available subjects and teachers
- Break periods included

#### 9. Get Timetable by Class
```
GET /by-class?academicYear=ObjectId&term=Term 1&grade=ObjectId&gender=male&section=ObjectId
```

## Integration with Existing Modules

### Settings Module Integration
- Uses `schoolTimings` from Settings model
- Supports grade-specific timing overrides
- Supports gender-specific timing overrides
- Supports grade+gender combined overrides
- Automatically calculates period durations and breaks

### GradeSubject Module Integration
- Validates that subjects are assigned to the specific grade/gender/section
- Ensures teachers are assigned to teach the subjects
- Prevents unauthorized subject-teacher combinations

## Validation Rules

1. **Unique Constraint**: One timetable per grade/gender/section/academic year/term combination
2. **Time Validation**: No overlapping periods within the same day
3. **Subject Validation**: Only subjects assigned via GradeSubject can be used
4. **Teacher Validation**: Only teachers assigned via GradeSubject can be used
5. **Time Format**: All times must be in HH:MM format (24-hour)
6. **Period Limits**: Period numbers must be between 1-15
7. **Duration Limits**: Period duration must be between 15-120 minutes

## Usage Examples

### Creating a Timetable

1. **Get Available Resources:**
```javascript
// Get available subjects and teachers
GET /api/v1/admin/timetable/available-subjects-teachers?academicYear=123&grade=456&gender=male&section=789

// Get school timings
GET /api/v1/admin/timetable/school-timings?gradeId=456&gender=male
```

2. **Generate Template (Optional):**
```javascript
GET /api/v1/admin/timetable/generate-template?academicYear=123&grade=456&gender=male&section=789
```

3. **Create Timetable:**
```javascript
POST /api/v1/admin/timetable
{
  "academicYear": "123",
  "term": "Term 1",
  "grade": "456",
  "gender": "male",
  "section": "789",
  "weeklyTimetable": {
    // ... timetable data
  }
}
```

### Retrieving Timetables

```javascript
// Get all timetables for a specific class
GET /api/v1/admin/timetable/by-class?academicYear=123&term=Term 1&grade=456&gender=male&section=789

// Get all timetables with filters
GET /api/v1/admin/timetable?grade=456&status=published&page=1&limit=10
```

## Permissions

All routes require authentication and appropriate permissions:
- `create`: Create timetables
- `read`: View timetables
- `update`: Modify timetables
- `delete`: Remove timetables

## Error Handling

The module includes comprehensive error handling for:
- Validation errors
- Duplicate timetable creation
- Invalid subject/teacher assignments
- Overlapping periods
- Missing required fields
- Non-existent references

## Future Enhancements

Potential improvements could include:
- Bulk timetable creation
- Timetable templates and cloning
- Conflict detection for teachers across classes
- Room availability checking
- Export functionality (PDF, Excel)
- Timetable comparison tools
- Automated timetable generation with AI

