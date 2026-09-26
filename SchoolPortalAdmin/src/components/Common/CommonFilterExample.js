import React, { useState } from 'react';
import CommonFilter from './CommonFilter';

// Example 1: Basic usage with all fields
const BasicFilterExample = () => {
    const [filterData, setFilterData] = useState(null);

    const handleFilterChange = (data) => {
        console.log('Filter changed:', data);
        setFilterData(data);
    };

    const handleSubmit = (data) => {
        console.log('Filter submitted:', data);
        // Handle filter submission
    };

    return (
        <CommonFilter
            title="Student Filter"
            onFilterChange={handleFilterChange}
            onSubmit={handleSubmit}
            showSubmit={true}
            submitLabel="Apply Filter"
        />
    );
};

// Example 2: Attendance filter without section
const AttendanceFilterExample = () => {
    const [filterData, setFilterData] = useState(null);

    const handleFilterChange = (data) => {
        console.log('Attendance filter changed:', data);
        setFilterData(data);
    };

    return (
        <CommonFilter
            title="Attendance Filter"
            onFilterChange={handleFilterChange}
            showSection={false}
            showSubmit={false}
        />
    );
};

// Example 3: Grade filter only (no gender, no section)
const GradeFilterExample = () => {
    const [filterData, setFilterData] = useState(null);

    const handleFilterChange = (data) => {
        console.log('Grade filter changed:', data);
        setFilterData(data);
    };

    return (
        <CommonFilter
            title="Grade Filter"
            onFilterChange={handleFilterChange}
            showGender={false}
            showSection={false}
            showSubmit={false}
        />
    );
};

// Example 4: With initial values
const FilterWithInitialValues = () => {
    const [filterData, setFilterData] = useState(null);

    const initialValues = {
        academic_id: { _id: '123', academicYear: '2024-2025' },
        grade_id: { _id: '456', gradeName: 'Grade 10' },
        gender: 'male',
        section: 'section1'
    };

    const handleFilterChange = (data) => {
        console.log('Filter with initial values changed:', data);
        setFilterData(data);
    };

    return (
        <CommonFilter
            title="Filter with Initial Values"
            initialValues={initialValues}
            onFilterChange={handleFilterChange}
            showSubmit={true}
            submitLabel="Update Filter"
        />
    );
};

// Example 5: With selection change callback
const FilterWithSelectionChange = () => {
    const [filterTitle, setFilterTitle] = useState('');

    const handleSelectionChange = ({ title, values }) => {
        console.log('Selection changed:', { title, values });
        setFilterTitle(title);
    };

    return (
        <div>
            <CommonFilter
                title="Filter with Selection Tracking"
                onSelectionChange={handleSelectionChange}
                showSubmit={false}
            />
            {filterTitle && (
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5' }}>
                    <strong>Current Selection:</strong> {filterTitle}
                </div>
            )}
        </div>
    );
};

export {
    BasicFilterExample,
    AttendanceFilterExample,
    GradeFilterExample,
    FilterWithInitialValues,
    FilterWithSelectionChange
};
