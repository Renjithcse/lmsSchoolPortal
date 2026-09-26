import React, { useEffect, useState } from "react";

const SingleCheckbox = ({ label, onChange, checked, mode }) => {
    const [isChecked, setIsChecked] = useState(checked);

    useEffect(() => {
        setIsChecked(checked)
    }, [checked])
    

    const handleCheckboxChange = () => {
        const newCheckedState = !isChecked;
        setIsChecked(newCheckedState);
        if (onChange) onChange(newCheckedState); // Pass the new state to the parent
    };

    return (
        <div className="flex items-center space-x-3">
            <input
                type="checkbox"
                checked={isChecked}
                onChange={handleCheckboxChange}
                disabled={mode === "view"}
                className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label
                className="text-gray-700 text-sm font-medium cursor-pointer"
                onClick={handleCheckboxChange}
            >
                {label}
            </label>
        </div>
    );
};

export default SingleCheckbox;
