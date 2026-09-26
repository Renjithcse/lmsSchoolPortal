import React from "react";

const Button = ({ label, onClick, variant = "primary", className = "", disabled = false, backgroundColor }) => {
    // Define button styles
    const baseStyles =
        "px-6 py-2 rounded-lg font-medium text-sm focus:outline-none focus:ring-2 transition-all duration-300 fit-content";

    const variants = {
        primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300",
        secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-300",
        danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-300",
        success: "bg-green-500 text-white hover:bg-green-600 focus:ring-green-300",
    };

    const disabledStyles = "opacity-50 cursor-not-allowed";

    // Combine styles
    const buttonStyles = `${baseStyles} ${variants[variant] || variants.primary} ${disabled ? disabledStyles : ""
        } ${className}`;

    return (
        <button onClick={onClick}  className={buttonStyles} disabled={disabled} style={{ backgroundColor: backgroundColor }}>
            {label}
        </button>
    );
};

export default Button;
