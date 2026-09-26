import React from "react";
import { useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { COLORS } from "../../assets/colors";

const CustomBackButton = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Navigate to the previous page
  };

  return (
    <IconButton
      onClick={ handleBack }
      color="primary"
      sx={ {
        width: 60, // Increase button size
        height: 60,
      } }
    >
      <ArrowBackIcon
        sx={ {
          fontSize: 40,
          color: COLORS.secondary // Increase icon size
        } }
      />
    </IconButton>
  );
};

export default CustomBackButton;
