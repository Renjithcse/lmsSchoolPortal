import React, { useEffect, useState } from "react";

const CheckboxGroup = ({ options, title, onChange, selected, mode }) => {
    const [selectedOptions, setSelectedOptions] = useState(selected);

    const handleCheckboxChange = (option) => {
        const updatedOptions = selectedOptions.includes(option)
            ? selectedOptions.filter((o) => o !== option)
            : [...selectedOptions, option];

        setSelectedOptions(updatedOptions);
        onChange && onChange(updatedOptions); // Pass updated options to the parent component
    };

    useEffect(() => {
        setSelectedOptions(selected); // Set the initial selected options on component mount
    }, [selected])
    

    return (
        <div className="max-w-md mx-aut">
            {title && <h2 className="text-lg font-semibold text-gray-700 mb-4">{title}</h2>}
            <div className="gap-2 flex flex-row">
                {options.map((option) => (
                    <label
                        key={option.value}
                        className="flex items-center space-x-3 cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            value={option.value}
                            checked={selectedOptions.includes(option.value)}
                            disabled={mode === "view"}
                            onChange={() => handleCheckboxChange(option.value)}
                            className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-300"
                        />
                        <span className="text-gray-600">{option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default CheckboxGroup;
